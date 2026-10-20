# Supabase からの移行 CLI

v2 から旧環境への書き戻しは [切り戻し CLI の手順と対応範囲](ROLLBACK.md) を参照。

Supabase コネクタで抽出した全件スナップショットを変換し、移行専用 API から D1・DO・R2 に投入して読み戻す。Bun 1.4 以上が必要。実行はこのディレクトリで行う。

```sh
cd v2/tools/migrate-from-supabase
bun run migrate --help
```

## 1. 投入用データを準備する

```sh
bun run migrate prepare \
  --source ../../.migration-data/<抽出日時>/source-snapshot.json \
  --out ../../.migration-data/<抽出日時>/prepared
```

`prepare` は外部に接続しない。入力の件数・参照関係・一意制約と、変換前後の香典金額・返礼状況などを検査してから `plan.json` を作る。ID は旧 ID から決定的に生成する。同じ入力からの再実行で同じ計画になる。空の旧台帳名には「香典帳（故人名未確認）」を補完し、警告を残す。

入力は `src/schemas.ts` の `snapshotSchema` に従う。

```json
{
	"format_version": 1,
	"project_ref": "<Supabase project ref>",
	"extracted_at": "2026-10-13T05:08:57.289594+00:00",
	"row_counts": { "auth.users": 0, "public.profiles": 0 },
	"data": { "auth.users": [], "public.profiles": [] }
}
```

上記は構造例であり、実行には移行対象の各テーブルが必要。空のテーブルも件数 `0` と空配列を含める。必要なキーは `auth.users`、`public.profiles`、`public.koudens`、`public.kouden_roles`、`public.kouden_members`、`public.kouden_purchases`、`public.relationships`、`public.kouden_entries`、`public.offerings`、`public.offering_allocations`、`public.offering_entries`、`public.offering_photos`、`public.telegrams`、`public.return_items`、`public.return_entry_records`、`public.return_record_items`。`auth.users` は `id`・`email`・`created_at`・`identities`（`provider`・`provider_id`）だけを使い、パスワードやセッションは不要。

抽出は Codex の Supabase コネクタで単一の読み取り専用 SELECT として行う。CLI は抽出済みファイルを受け取る。移行時の最終抽出では旧アプリの書き込みを停止し、別途 DB 全体のバックアップを取得する。バックアップは、Git 管理外でアクセスを自分だけに絞った新しい空のフォルダ（`v2/.migration-data/final-backup-<日付>/` など）に移ってから、リポジトリの絶対パスで `& '<リポジトリ>\v2\tools\migrate-from-supabase\scripts\copy-legacy-db.ps1' -DumpOnly` を実行し（既存の dump があるフォルダや Git の管理対象のフォルダでは止まる）、復元に使う 4 ファイル（`roles.sql`・`schema.sql`・`data.sql`・`managed-objects.sql`）と `manifest.json`（サイズ・SHA-256）を作り、R2 の `kouden-legacy-archive` の `backups/` に 1 年間保管する。

### 返礼品画像・旧供物写真がある場合

ファイル本体を先に保全し、返礼品の旧 `image_url` または供物写真の旧 `storage_key` とローカルファイルの対応表を `--files` で渡す。コネクタの Storage メタデータだけでは本体の代わりにならない。供物写真の `source` には `public.offering_photos.storage_key` の値をそのまま使う。

```json
[
	{
		"source": "https://<project>.supabase.co/storage/v1/object/public/return-items/example.png",
		"path": "images/example.png"
	}
]
```

```sh
bun run migrate prepare \
  --source ../../.migration-data/<抽出日時>/source-snapshot.json \
  --files ../../.migration-data/<抽出日時>/file-map.json \
  --out ../../.migration-data/<抽出日時>/prepared
```

パスは対応表のディレクトリを基準に解決し、その外のファイルは受け付けない。必要な画像の対応付けが欠けている場合は停止する。画像は `prepared/files/<SHA-256>.bin` に保存し、計画にコピー先キー・サイズ・SHA-256 を記録する。1 ファイルは 5 MiB 以下。取り込み API は JPEG・PNG・WebP のシグネチャを検査する。

供物写真は `koudens/{koudenId}/gifts/{giftId}/{photoId}` に保存する。元の供物との対応・説明・登録者・日時を DO に保持し、メンバーが「いただきもの」の詳細から閲覧できる。写真の新規追加・削除 UI は [#170](https://github.com/otomatty/kouden/issues/170) の後続作業。DO のスキーマは次回アクセス時に自動更新する。

## 2. 投入して照合する

対象環境に今回の取り込み・照合 API をデプロイし、D1 のマイグレーションを適用しておく。Access の `/internal/import/*` 用アプリケーションに Service Auth ポリシーとサービストークンを設定し、`apps/app/deploy.settings.ts` の対象 mode の `importAccess.teamDomain`・`importAccess.aud` を一致させる。環境整備は [#169](https://github.com/otomatty/kouden/issues/169) で管理する。

CLI の環境変数に `CF_ACCESS_CLIENT_ID` と `CF_ACCESS_CLIENT_SECRET` を設定する。秘密はコマンド引数に書かない。CLI は全リクエストに認証ヘッダーを付け、リダイレクトを追跡しない。

```sh
bun run migrate import \
  --plan ../../.migration-data/<抽出日時>/prepared \
  --url https://staging.<ドメイン> \
  --report ../../.migration-data/<抽出日時>/reports/import-01
```

ローカルでは Worker と CLI に同じ `IMPORT_DEV_TOKEN` を設定し、`--url http://localhost:5173` を使う。開発トークンはループバック接続専用なので、リモートへの投入時には CLI 側の `IMPORT_DEV_TOKEN` を解除する。

本番投入は新旧両方のアプリへの書き込みを止めた状態で、1 プロセスだけで行う。固定スナップショットを使うリハーサルでは旧アプリを停止する必要はないが、投入先には利用者から書き込めないようにする。ユーザーを最大 200 人ずつ投入・照合し、各台帳について画像の転送、D1・DO への投入、読み戻しの順に実行する。開始前に全ローカル画像のハッシュを確認する。台帳の JSON は 10 MiB 以下。

通信障害と HTTP 429 / 502 / 503 / 504 は最大 3 回試行する。再実行時は全件を再送し、台帳を計画の内容に入れ替えて再照合する。途中まで投入されたデータを自動削除する処理や、全台帳をまたぐトランザクションはない。失敗後に原因を確認して再実行する場合は、新しいレポートディレクトリを指定する。利用者が v2 に書き込み始めた後に古い計画を再投入してはいけない。

## 3. 読み取りだけで再照合する

```sh
bun run migrate verify \
  --plan ../../.migration-data/<抽出日時>/prepared \
  --url https://staging.<ドメイン> \
  --report ../../.migration-data/<抽出日時>/reports/verify-01
```

`verify` はデータを書き換えない。ユーザー照合には POST を使うが、サーバー側では SELECT のみを行う。ローカルの画像本体は不要で、計画と R2 のメタデータを比較する。

| 対象        | 照合する項目                                                                                                                    |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------- |
| D1 ユーザー | 全ユーザーの ID・旧 ID・メール・表示名・作成日時・旧認証方式。旧 Google 利用者は sub も照合。メール利用者の投入後の紐づけは保持 |
| D1 台帳     | オーナー・旧 ID・名前・状態・日時、有料状態、メンバーの ID・役割・参加日時・招待者、購入行                                      |
| DO          | 行事・関係・差出人・いただきものの種類別件数、香典合計、返礼状況別件数、返礼明細・返礼品・ルールの件数                          |
| R2          | 台帳配下の全キーとサイズ、返礼品画像の SHA-256。予定外のファイルも不一致とする                                                  |
| 全体        | 移行済みユーザー・旧ユーザー・台帳の総数。計画に含まれない旧データが残っていても失敗する                                        |

各 API の成功応答に加え、保存先を読み戻して確認する。不一致が 1 件でもあれば、後続の台帳への処理を止める。`import` / `verify` は **全件スナップショット用**であり、一部だけの計画では総数の照合を通過しない。

## レポートと未対応範囲

`--report` の下に `report.json` と `report.md` を保存する。結果は `running` / `passed` / `failed`。完了しなかった実行は `running` のままであり、合格として扱わない。コマンドの終了コードは成功時 `0`、不一致や失敗時 `1`。レポートには計画の SHA-256、接続先、開始・終了時刻、照合件数、各台帳の件数・金額の予定値と実測値、警告の集計、不一致の項目名を残す。氏名・メール・住所などの値はレポートに書かない。

入力形式や計画の事前検証に失敗した場合は投入を開始せず、レポート作成前に終了する。ツールが定義したエラーコードだけを標準エラー出力に表示し、通信エラーの本文や入力値は出力しない。未知の例外は固定文言になる。

| エラーコードの例                                | 確認すること                                           |
| ----------------------------------------------- | ------------------------------------------------------ |
| `snapshot_count:public.kouden_entries`          | 対象テーブルの存在と `row_counts` に記録した件数       |
| `unassigned_source:public.offering_allocations` | 元データに割り当て先のない行・重複した割り当てがないか |
| `unassigned_source:public.offering_photos`      | 供物に紐づかない写真や重複した写真がないか             |
| `source_mismatch:kodenTotal`                    | 変換前後の香典合計が変わるデータがないか               |
| `missing_access_credentials`                    | Access サービストークンの環境変数を設定したか          |
| `dev_token_requires_loopback`                   | リモート接続で `IMPORT_DEV_TOKEN` を解除したか         |

`plan.json`、元スナップショット、画像、警告の詳細には個人情報が含まれる。`v2/.migration-data/` は Git・lint・format の対象から除外している。出力はローカルの制限付きフォルダに保存すること。Unix の mode 指定は Windows の ACL を設定するものではない。

- 旧供物写真は件数と DO の対応・説明・登録者・日時、R2 のキー・サイズ・SHA-256 を照合する。R2 に写真がない場合は台帳の取り込み前に停止する。
- `common` / `gift` / `funeral` スキーマは移行しない。旧アプリは組織機能を撤去済みで、本番 `common` の組織データ（オーナーの試作用 6 行）は 2026-10-18 に削除した（[#190](https://github.com/otomatty/kouden/issues/190)）。初回抽出（2026-10-13）の元スナップショットには 6 行が残る。非空のテーブルがあれば `unmapped_schema_data` の警告を出す。
- 非公開の `receipts` 4 件（購入記録のない領収書 PDF）は v2 で扱わず、保管専用の R2 バケット `kouden-legacy-archive` の `receipts/` に 1 年間保全した（2026-10-19、[#191](https://github.com/otomatty/kouden/issues/191) に件数・サイズ・SHA-256）。最終抽出では `storage.objects` の `receipts` が同じ 4 件・同じサイズかを確かめ、増減や変化があれば保全をやり直す。
- 照合は上記の集計・D1 行・画像に対する検査であり、DO のすべてのテキスト内容や画面表示まで保証するものではない。切り替え前の 10 冊の目視比較は別途行う。
- `passed` でも変換警告は残り得る。切り替える前に、下の「最終抽出の警告の判断基準」と突き合わせる。
- 故人名の確認は、移行済みで未確認の香典帳を開いたオーナーに案内する。設定画面の「確認して保存する」で確認日時を保存する。D1 の `0007_deceased_name_confirmation.sql` の適用が必要。確認は投入・照合と取り込み口の無効化を終えてから行う。再取り込みは元の仮の名前へ戻すため確認状態も未確認に戻り、確認後の名前・更新日時は元の投入計画との照合対象から変わる。
- Supabase への逆変換・切り戻し、画面比較を含むリハーサル、本番切り替えは [#168](https://github.com/otomatty/kouden/issues/168) の残作業。初回投入・再投入と自動照合の実測結果は [2026-10-13 の記録](../../../docs/rebuild/06-migration-rehearsal-20261013.md) を参照。

### 最終抽出の警告の判断基準

初回抽出（2026-10-13）の警告 294 件の扱いは [#192](https://github.com/otomatty/kouden/issues/192) で決めた。最終抽出の `prepare` で出た警告は、`report.md` の警告の集計をコードごとにこの表と突き合わせる。停止する条件に当たれば投入を始めず、原因を確認する。

| 警告コード                         | 初回 | 許容する条件                                                             | 停止する条件                                                                 |
| ---------------------------------- | ---: | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| `deceased_name_guessed`            |   40 | 件数が抽出した台帳数と一致する。故人名はオーナーが v2 で確認する         | 台帳数と一致しない（変換の不具合）                                           |
| `deceased_name_missing`            |    2 | 2 冊以内で、下の手順で各冊の記録件数を確認済み                           | 3 冊以上になった。または記録件数を確認していない台帳がある                   |
| `relationship_description_dropped` |  240 | 0 件。旧 DB が台帳作成時に入れる定型の名前と説明の組（6 種）は警告しない | 1 件でもある。その台帳の説明は利用者が書いたものなので、扱いを決めてから進む |
| `kouden_description_dropped`       |    9 | 説明のある台帳のオーナー全員へ、説明が移らないことと内容を連絡済み       | 連絡していない台帳がある。初回より増えた台帳も連絡の対象に加える             |
| `unmapped_schema_data`             |    3 | 0 件（`common` / `gift` / `funeral` がすべて空）                         | 1 行でもある。誰が何のために作ったかを確認する                               |
| 上記以外                           |    0 | なし                                                                     | 1 件でもある                                                                 |

- 初回の 240 件は、すべて定型の説明だった。v2 の関係には説明の欄がないので、定型の説明は移さず警告もしない。
- `deceased_name_guessed` は台帳ごとに必ず 1 件出る。切り替える前に未確認の台帳を数え、オーナーへの案内の対象にする。
- `kouden_description_dropped` の説明は移さず、元スナップショットに残す。長い文や個人情報を含む説明は、連絡する前に内容を確認する。切り替え後に説明が必要になれば、スナップショットから再投入できる。
- 台帳名が空の台帳（`deceased_name_missing`）は、最終抽出の前に旧 DB で記録件数だけを読み取る。中身は見ない。すべて 0 件の台帳は、移行対象から外すかをオーナーと決める。

```sql
select k.id,
  (select count(*) from kouden_entries e where e.kouden_id = k.id) as entries,
  (select count(*) from offerings o where o.kouden_id = k.id) as offerings,
  (select count(*) from telegrams t where t.kouden_id = k.id) as telegrams
from koudens k
where btrim(k.title) = '';
```

## 一時環境でのリハーサル

通常の staging に先に Google ログインすると、旧ユーザーと同じ Google sub に別の内部 ID が作られる。現在の投入 API はこの衝突を一意制約で拒否する。既存ユーザーの削除や Google sub の書き換えで回避せず、app の `--mode rehearsal` を使う。

`rehearsal` は Worker `kouden-app-rehearsal`、D1 `kouden-db-rehearsal`、R2 `kouden-files-rehearsal` を使う。DO の名前空間も専用 Worker に属する。メール・決済は無効で、Google ログインと運営者画面は使わない。これは CLI の転送・再投入・照合を検証する環境であり、画面比較や実ログインの試験とは分ける。

1. 通常の staging のユーザーと関連データの件数を読み取り、Git 除外フォルダへ記録する。上記の一時リソースが既存の用途で使われていないことを確認する。
2. 専用ホスト `kouden-app-rehearsal.saedgewell.workers.dev` 全体に Access を設定する。有効期限の短い専用サービストークンを発行し、再利用可能な Service Auth ポリシーにそのトークンだけを含める。
3. `apps/app/deploy.settings.ts` の `rehearsal.access` と `rehearsal.importAccess` に専用アプリの teamDomain・AUD を一時設定する。ホスト全体を1つの Access アプリで保護するため、両設定は同じ値を必須とし、不一致ならデプロイを止める。staging・production の `access` / `importAccess` に設定した AUD の再利用も拒否する。同じ Access チームを使うことはできるが、専用アプリの AUD を使う。通常の staging の値を変えない。
4. Git 除外の secrets ファイルに専用のランダムな `SESSION_SECRET` を用意する。Google ログインを使わないため `GOOGLE_CLIENT_SECRET` は `disabled-for-rehearsal` とする。app を `bun run deploy -- --mode rehearsal --secrets-file <ファイル>` で配置し、`bun run db:migrate -- --mode rehearsal` を実行する。
5. 未認証と誤ったサービストークンが拒否され、正しいトークンだけが `/internal/import/summary` の件数 0 を読めることを確認する。その後に固定スナップショットを `prepare` し、専用 URL へ `import` → `verify` → 再 `import` → 再 `verify` を実行する。各実行のレポートディレクトリを分ける。
6. 終了コード・レポートの `passed`・不一致 0・開始終了時刻を確認し、件数と所要時間だけを共有する。警告の確認、画像本体がある場合の実転送、10冊の画面比較、切り戻し試験は別途必要。
7. [サービストークンを `enabled: false` で無効化](https://developers.cloudflare.com/cloudflare-one/access-controls/service-credentials/service-tokens/)してから、今回作成した Worker と DO 名前空間、D1、R2 を削除する。ポリシーが参照しているトークンは直接削除できない。削除前に名前と作成時の ID が一致することを確認し、通常の staging を対象にしない。Worker の削除は他 Worker からの参照があれば止める。R2 に画像がある場合は先に専用バケット内の本体を削除する。
8. リソースが一覧から消えたことを確認してから、専用 Access アプリ、ポリシー、サービストークンの順に削除する。通常の staging のユーザーとセッションが維持されていることを確認する。`rehearsal` の Access 設定は空へ戻し、秘密を含まない手順・結果だけをコミットする。

## 検証

```sh
# v2/ で実行
bun run --filter @kouden/migrate-from-supabase test
bun run --filter @kouden/domain test
bun run --filter @kouden/app test
```

CLI のテストで再実行・読み取り照合・200 人超の分割・不一致時の停止・画像の欠落と改変・余剰データ・通信失敗を確認する。app のテストでは Workers ランタイムの D1・DO・R2 を使い、読み戻し、権限・金額の差の検出、R2 のハッシュ照合、取り込み口の認証を確認する。
