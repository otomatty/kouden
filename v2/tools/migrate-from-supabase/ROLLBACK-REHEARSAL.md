# 隔離した Supabase での切り戻しリハーサル

[#193](https://github.com/otomatty/kouden/issues/193) の手順。旧本番 DB を新しい Supabase プロジェクトへ複製し、v2 への投入 → v2 での変更 → [ROLLBACK.md](./ROLLBACK.md) の書き戻し → 照合 → 旧・新の画面比較までを通しで行う。旧本番 DB には読み取り（dump と SELECT）しか行わない。

PGlite では確認できない次の点もここで確かめる。

- 実 Supabase への psql 接続（Session pooler・SSL）と、1 トランザクションでの書き戻し・取り消し
- 返礼金額トリガーの定義と、同時書き込み時の動作（PGlite は単一接続）
- #184 の RLS マイグレーション（`20261018010000_align_telegram_offering_entry_rls_role_names.sql`）と、#194 の返礼金額マイグレーション（`20261018000000_align_return_amount_triggers_with_deployed.sql`）の適用前後
- #187 の画像の逆転送（実 Storage）

## 構成

| 役割     | 使うもの                                                                                                |
| -------- | ------------------------------------------------------------------------------------------------------- |
| 旧 DB    | 新しい Supabase プロジェクト（以下「リハーサル用」）。組織 Saedgewell、リージョン `ap-northeast-1`      |
| 旧アプリ | リポジトリ直下の Next.js をローカルで起動し、リハーサル用に接続する（`http://localhost:8788`）          |
| v2       | `v2/apps/app` をローカルで起動する（`http://localhost:5173`）。取り込み・切り戻しは開発用トークンを使う |

v2 をローカルで動かすのは、Cloudflare に一時リソースを作らずに済み、ログイン済みのセッションを用意して画面から変更できるため。`--mode rehearsal` の一時環境は Google ログインを使わず、画面からの変更ができない。

## 準備（利用者が行う）

パスワード・鍵はチャット・issue・PR・リポジトリに書かない。パスワード管理ツールに保存し、作業する端末の環境変数で渡す。

1. Supabase のダッシュボードでリハーサル用プロジェクトを作る。名前は `kouden-rollback-rehearsal`、リージョンは Tokyo。選べるなら Postgres 15（本番は 15.8）にし、選べなければ版の違いを結果に記録する。Free プランの組織で作れる稼働中のプロジェクトは 2 つまでで、本番と合わせて上限になる。
2. Authentication の設定で、新規登録（Allow new users to sign up）を無効にし、Site URL を `http://localhost:8788` にする。旧アプリは 6 桁の認証コードでログインするため、Email Templates の Magic Link の本文を、リンク（`{{ .ConfirmationURL }}`）ではなくコード（`{{ .Token }}`）を含むものにする。複製した `auth.users` には実在の利用者のメールアドレスが入る。独自の SMTP は設定しない（既定の送信は組織のメンバー宛てにしか届かない）。自分以外のアドレスにメールを送る操作をしない。
3. Database の SSL Configuration から CA 証明書をダウンロードし、Git 管理外に置く。環境変数 `PGSSLROOTCERT` にそのパスを設定する。
4. [PostgreSQL のクライアント](https://www.postgresql.org/download/windows/)（`psql`）を入れて PATH を通し、Docker Desktop を起動する（`supabase db dump` が使う）。
5. Git 管理外の作業フォルダ `v2/.migration-data/rollback-rehearsal-<日付>/` を作り、ACL を自分だけに絞る。dump には利用者の個人情報とパスワードのハッシュが入る。
6. スクリプトを実行する PowerShell の環境変数に、本番とリハーサル用の Session pooler の接続文字列（5432 番ポート）を設定する。Free プランの Direct connection は IPv6 のみのため、Session pooler を使う。パスワードに記号があれば URL エンコードする。

```powershell
$env:PROD_DB_URL = 'postgresql://postgres.<本番ref>:<パスワード>@<pooler>:5432/postgres'
$env:REHEARSAL_DB_URL = 'postgresql://postgres.<リハーサル用ref>:<パスワード>@<pooler>:5432/postgres'
$env:PGSSLROOTCERT = '<CA 証明書のパス>'
```

スクリプトは psql にパスワードを `PGPASSWORD` で渡し、`sslmode=verify-full` で証明書を検証する。`supabase db dump` は Docker 内の `pg_dump` に URL を渡すため、ホストの証明書を使えず、パスワードもコマンドの引数に入る。そのため `sslmode=require`（平文に落ちない）を付けて実行する。自分だけが使う端末で実行する。

## 1. 旧本番 DB を複製する

[Backup and Restore using the CLI](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore) に従う。手順は `scripts/` の 2 つのスクリプトにまとめてある。作業フォルダで実行する。

```powershell
& <リポジトリ>\v2\tools\migrate-from-supabase\scripts\copy-legacy-db.ps1
& <リポジトリ>\v2\tools\migrate-from-supabase\scripts\compare-legacy-db.ps1
```

`copy-legacy-db.ps1` は次を行う。接続先が逆のときと、空でないプロジェクトへの復元は止める。

1. 本番を `supabase db dump` で roles・schema・data の 3 つに分けて保存する（既にあれば使い回す）。
2. auth・storage の表に付けた独自トリガー（新規ユーザーの `profiles` を作る `on_auth_user_created` など）は dump に含まれないため、本番の定義を読み取り、リハーサル用にないものだけを作る SQL を用意する。
3. リハーサル用へ 1 トランザクションで復元する。データの投入中だけトリガーを止める。
4. 複製された `pg_cron` のジョブ（無料の香典帳を 14 日で自動アーカイブする `archive_free_koudens_daily`）を止める。リハーサル中に状態が変わり、前提照合が崩れるのを防ぐ。
5. 複製したログインセッション（`auth.sessions`・`auth.refresh_tokens`）を消す。

復元の前に、リハーサル用の Database の Extensions で、本番と同じ拡張を有効にする（2026-10-19 の本番: `moddatetime`・`pg_cron`・`pg_trgm`・`pgcrypto`・`pgjwt`・`uuid-ossp`。`pg_stat_statements`・`pgsodium`・`supabase_vault`・`plpgsql` は既定で有効）。復元に失敗した場合は何も残らない。ドキュメントのトラブルシューティング（`supabase_admin` の所有者変更、`cli_login_postgres` の付与）に従って dump を直し、もう一度実行する。

`compare-legacy-db.ps1` は、表ごとの件数、public の関数、public・auth・storage のトリガー、public・storage の RLS ポリシーを本番と比べる。件数と定義の md5 だけを `compare/` に出し、行の中身は出さない。止めた `cron.job` と消したセッションの件数以外に差分があれば、原因を直してから先へ進む。

Storage は DB の行（`storage.objects`）だけが複製され、本体は複製されない。初回抽出の時点で本体があったのは非公開の `receipts` 4 件だけで、移行・切り戻しの対象外。

## 2. 元スナップショットを取り、v2 に投入する

ここからの psql とこのリポジトリの CLI は、リハーサル用への接続を [ROLLBACK.md](./ROLLBACK.md) の「書き戻し・照合」の表と同じ環境変数で受け取る（`PGHOST` は pooler のホスト、`PGUSER` は `postgres.<リハーサル用ref>`、`PGPASSWORD`、`PGSSLMODE=verify-full`、`PGSSLROOTCERT`）。

初回抽出の `v2/.migration-data/20261013T050857Z/extract.sql` は `project_ref` に本番の ref を書いている。リハーサル用の ref に置き換えたコピーを作り、psql で出力する。モデルや会話を経由させない。

```powershell
New-Item -ItemType Directory cutover
(Get-Content -Raw ..\20261013T050857Z\extract.sql).Replace('tcqnsslsaizqwjuyvoyu', '<リハーサル用ref>') | Set-Content -Encoding ascii extract.sql
psql -X -q -A -t -d postgres -f extract.sql -o cutover\source-snapshot.json
```

切り戻しの `apply` / `verify` は、接続先とこのスナップショットの `project_ref` を照合する。本番の ref のスナップショットでは、リハーサル用に書き込めない。

v2 をローカルで起動する。保存先は環境変数 `KOUDEN_LOCAL_STATE` で作業フォルダ内の新しいフォルダ（例: `v2-state-1`）にし、普段の開発データと分ける（`v2/apps/app` で `bun run dev`）。[README](./README.md) の手順で `prepare` → `import` → `verify` を行う。投入先は `http://localhost:5173`、トークンは `IMPORT_DEV_TOKEN=dev-import-token`。`verify` が `passed` になったら、変更する前に一度 `rollback export` → `plan` を行い、変更 0 件・ブロッカー 0 件を確認する。

画面から変更するときは、`v2/e2e/scripts/prepare.ts` と同じ方法で、操作する移行済みユーザーのセッションをローカル D1 の `sessions` に追加し、Cookie `__Host-kouden_session` に設定する。

## 3. v2 で変更し、書き戻す

1 回の書き戻しで次の変更をまとめて確かめる。台帳 ID と件数だけを記録し、氏名は記録しない。旧監査履歴の退避を確かめるため、香典を削除する台帳は、リハーサル用で履歴のある香典を含むものを選ぶ。

```sql
select e.kouden_id, count(distinct e.id) as entries_with_logs
from public.kouden_entries e join public.kouden_entry_audit_logs l on l.entry_id = e.id
group by 1 order by 2 desc limit 5;
```

削除した香典の履歴が `kouden_rollback.deleted_entry_history` に退避され、件数が削除前の履歴と一致することも確かめる。

| 確認すること           | v2 で行う変更                                                      | 関連 |
| ---------------------- | ------------------------------------------------------------------ | ---- |
| 香典の追加・更新・削除 | 香典を追加・修正し、旧監査履歴のある香典を 1 件削除する            | #185 |
| オーナーの譲渡         | 香典帳のオーナーを別のメンバーへ譲渡し、元のオーナーを編集者にする | #183 |
| 編集者の追加・変更     | 閲覧者を編集者に変える                                             | #184 |
| 新規ユーザー           | 新しいユーザーを招待し、`user-map.json` で旧 Auth ID と対応づける  | #186 |
| 連名・按分・返礼       | 連名の供物を作り、按分を変え、返礼の状況・発送日を変える           | #188 |
| 旧画面にない値         | 故人名・読み仮名・返礼期限を変える                                 | #189 |
| 関係名の再利用         | 関係名を入れ替える                                                 | #181 |
| 画像                   | 返礼品画像を追加・差し替える                                       | #187 |

新規ユーザーは次の順で用意する。ローカルの v2 は Google ログインを使えないため、新しいユーザーもセッションを直接作る。

1. ローカル D1 の `users` に、`legacy_user_id` のない新しいユーザー（`google_sub` は仮の値、メールは `example.test` のアドレス）を追加し、そのセッションを作る。
2. 移行済みのオーナーとして招待リンクを発行し、新しいユーザーのセッションでリンクを開いて受諾する。
3. リハーサル用の Admin API（`auth.admin.createUser`。メールは送らない）で旧 Auth ユーザーを作り、`on_auth_user_created` で `profiles` の行ができたことを確かめる。v2 のユーザー ID と旧 Auth ID を `user-map.json` に書く。

画像の逆転送では、`SUPABASE_SECRET_KEY` にリハーサル用の Secret key を設定する。

[ROLLBACK.md](./ROLLBACK.md) の「取得・計画」「画像の逆転送」「書き戻し・照合」に従い、`export` → `plan` → `images` → `apply` → `verify` を行う。トークンは `ROLLBACK_DEV_TOKEN=dev-rollback-token`、`--project-ref` はリハーサル用の ref、接続は 2 で設定した環境変数を使う。

あわせて次を確かめる。

- 同じ計画で `apply` を再実行し、書き込みなしで成功する。
- `apply` の途中で接続を切ったときに何も確定せず、`verify` で状態が分かる。
- `plan` のあとにリハーサル用の旧 DB を 1 行変えると、前提照合で停止する。

## 4. 返礼金額トリガーと RLS のマイグレーション

1〜3 は本番と同じ定義（マイグレーション適用前）で行う。そのあと、リハーサル用に次の順で適用し、確認する。

1. 返礼金額（#194）: 2 つの psql から同じ返礼記録へ明細を同時に追加・削除し、`return_items_cost` が明細の合計と一致すること、デッドロックしないことを確かめる。適用前は明細の書き込みが `public.return_records` の不在で失敗することも記録する。
2. RLS（#184）: 適用前後で、一般の編集者が旧アプリから弔電・供物の紐づけを追加・変更できるかを確かめる。
3. 適用後に 2〜3 をやり直し、書き戻しと照合が `passed` になることを確かめる。1 回目の書き戻しと前提照合の試験で旧 DB は変わっているため、最初の元スナップショットは使えない。前提照合の試験で変えた行を戻し、リハーサル用の今の状態から元スナップショットを取り直す。ローカルの v2 は `KOUDEN_LOCAL_STATE` を新しいフォルダ（例: `v2-state-2`）にして空の状態から投入する。

## 5. 画面を比べる

切り戻した台帳を含む 10 冊を選び、旧アプリ（リハーサル用）と v2（ローカル）で、香典・供物・弔電・返礼の件数と合計、メンバーと権限、画像を見比べる。

- 旧アプリ: `.env.local` をリハーサル用の URL・鍵にして `http://localhost:8788` で起動する。自分のメールアドレスで認証コードのログインを行う（既定の送信で自分にだけ届く。複製に自分のアカウントがなければ、新規登録を一時的に有効にして作る）。他の利用者としてはログインできないため、`verify` が `passed` になった後に、リハーサル用の旧 DB で自分を比較する 10 冊の閲覧者に追加する。書き戻しの照合が終わった後なので、照合には影響しない。
- v2: 比較する台帳のオーナーのセッションをローカル D1 に追加して開く（手順 2 と同じ方法）。

## 6. 記録と後片付け

[#193](https://github.com/otomatty/kouden/issues/193) に、手順ごとの所要時間、`passed` などの結果、件数、見つかった差異と対応を書く。個人情報・接続文字列・鍵は書かない。

終わったら次を行う。

- リハーサル用プロジェクトを削除する（複製した個人情報と認証情報を残さない）。
- 作業フォルダの dump・スナップショット・レポート・ローカルの v2 の保存先を削除する。結果の記録に必要なのは件数と所要時間だけ。
- 環境変数からパスワードを消す。
