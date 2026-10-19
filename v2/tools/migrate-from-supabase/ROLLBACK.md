# v2 から旧 Supabase へ書き戻す

一般公開後の切り戻し用 CLI。最終移行時のスナップショットと、書き込みを停止した v2 を比較し、旧形式に戻せる差分を SQL にする。通信しない `plan`、明示的に書き込む `apply`、読み取り専用の `verify` に分ける。

この版は移行済みの香典帳を対象にする。切り替え後に作った香典帳は書き戻さず、レポートに一覧で出す（後述）。旧形式に戻せない変更が1件でもあれば全体を停止する。ブロッカーの解消、隔離した Supabase でのリハーサル、画面比較が終わるまでは、本番切り戻しの準備完了と扱わない。

## 対応する変更

- 既存ユーザーの表示名、台帳名・状態、既存ユーザー間のメンバー変更。旧アプリの認可に使うロール名と権限配列の両方を検査する。一般メンバーの編集者は旧の `editor` ロールで書き戻す（弔電RLSとの関係は後述）。独自名のロールを権限配列だけで代用しない。
- オーナーの譲渡（後述）。
- 関係・返礼品カタログの追加・更新と、参照を解除した行の削除。
- 香典・供物・供花・弔電の追加・更新。連名・按分・行事などは旧画面で読める形に落とす（後述）。
- 旧形式で表せる返礼状況・金額・送付先・備考・JSON明細。合計と生成列は旧DBの式で計算する。`return_items_cost` は旧DBでは表の明細（`return_record_items`）の合計をトリガーが入れる欄で、旧アプリもJSONの明細を書くときは変えないため、書き戻さない（本番は全件0）。
- 旧環境の依存行がない香典・供物・弔電の削除と、返礼の削除。香典の旧監査履歴・ロックは削除前に退避する。いただきもののない差出人は書き戻さない（後述）。
- 返礼品画像・供物写真の追加・差し替え・削除。画像は `images` で旧 Storage へ逆転送する（後述）。供物・供花以外への写真は `photo_requires_offering`、別の台帳のキーは `image_outside_book` で停止する。

変わらなかった値には元スナップショットの値を使う。前後の空白、台帳・関係の説明、元の供物分類、未移行の列を保持する。追加行のIDはv2のIDから決定的に作る。変更履歴・受付番号など旧画面にない運用情報はexport側に残す。

旧メンバーの削除判定は、実際にv2へ移行したメンバーだけを対象にする。認証ユーザー不在により `member_without_user` として移行時に除外した旧行は保持する。

実DBでは同じ台帳の有効な関係名に一意制約がある（`relationships_kouden_id_name_enabled_key`、`WHERE is_enabled`）。一意制約は遅延できないため、SQLは更新・追加の前に、改名・非表示・削除する有効な関係を `is_enabled = false` にして名前を空け、更新時に最終の値へ戻す。これにより、削除・改名・非表示にする関係の名前の再利用や、2つの関係の名前の入れ替えができる。最終状態で有効な関係名が重複する場合だけ `legacy_relationship_name_conflict` で停止する。非表示の関係だけの同名は許容する。

### 返礼金額のDB定義

2026-10-14にSupabaseコネクタで実DBの関数・トリガー定義を読み取り確認した。`return_entry_records` の `tr_update_return_entry_total_amount` は INSERT / UPDATE 前に `calculate_total_amount` を呼び、`total_amount` を香典額＋紐づく供物の `price * quantity` に設定する。旧明細の合計は `calculate_return_items_cost` が `return_items_cost` に反映する。切り戻し計画はこの実DBの定義を使う。

2026-10-18に再確認し、リポジトリの定義を `supabase/migrations/20261018000000_align_return_amount_triggers_with_deployed.sql` で実DBに揃えた。このマイグレーションは、実DBに未適用の `20260616000000_atomize_return_entry_record_total_amount.sql`（明細合計を `total_amount` に設定する）のトリガーと関数を削除し、実DBの返礼金額の関数・トリガーを記録する。実DBとの違いは次のとおり。

- 実DBの `return_record_items` には、存在しない `public.return_records` を更新する `tr_update_return_record_total_amount` があり、明細の追加・更新・削除がすべて失敗する（実DBの明細は0件）。マイグレーションはこのトリガーを削除する。
- 実DBの `calculate_return_items_cost` は IMMUTABLE で、明細トリガー内では直前の変更が見えず、1回前の合計が `return_items_cost` に残る。マイグレーションでは STABLE にする。
- 実DBは香典額・供物の価格と数量の変更、供物の紐付けや明細の親の付け替えで、返礼金額を再計算しない（付け替えでは元の親が古いまま残る）。マイグレーションはこれらでも再計算し、同じ処理の供物トリガー2つを1つにまとめる。
- 実DBの明細トリガーは1文のUPDATEで `return_items_cost` を集計するため、同じ返礼記録への同時書き込みで、ロック待ちの後も古いスナップショットで集計して明細を取りこぼし得る。マイグレーションでは親の行ロックを取ってから次の文で集計する。

マイグレーションは実DBにまだ適用していない。切り戻しは旧明細テーブルへの変更を `legacy_return_lines_require_manual_mapping` で停止するため、壊れたトリガーの影響を受けない。PGliteでは実DBと同じ壊れたトリガーと未適用の 20260616 を置いた状態から、このマイグレーションを適用し、書き戻し・照合と、明細追加・元データの変更・付け替え後の金額を確認している。隔離環境でのリハーサルではトリガー定義も比較し、計算式を変更したDBにそのまま適用しない。適用後の値が計画と異なる場合は、照合エラーによりトランザクション全体を取り消す。

## 実行前

1. 両アプリの書き込みを止める。画面だけでなく、運営者操作、OAuthによるユーザー更新、Stripe Webhook、ジョブ・通知も対象。`--writes-stopped` は運用者の確認であり、CLIが停止する機能ではない。作業終了まで停止を維持する。
2. 旧Supabaseを `pg_dump` で、v2のD1・DO・R2も全体をバックアップする。CLIのexportは比較用で、セッション・招待・バイナリを含む全体バックアップの代わりにはならない。
3. 最終移行に実際に使った `source-snapshot.json` を用意する。後から抽出したものや編集したものに差し替えない。移行後に旧DBで変更があれば前提照合で停止する。
4. `/internal/import/rollback/*` 専用のAccessアプリケーションを作り、切り戻し担当の専用サービストークンだけをService Authで許可する。`apps/app/deploy.settings.ts` の対象環境の `rollbackAccess` にチームドメインとAUDを設定してデプロイし、そのトークンの `CF_ACCESS_CLIENT_ID` / `CF_ACCESS_CLIENT_SECRET` をCLIの環境変数で渡す。通常の取り込み・画面用・他環境のAUDは流用しない。全件抽出は `rollbackAccess` が空なら404で、取り込み設定から自動的に有効にはならない。ローカルは `ROLLBACK_DEV_TOKEN` を使う。
5. Git管理外の非公開ディレクトリに保存する。Windowsでは事前にACLを限定する。JSON・SQL・レポートは個人情報を含むので、issueやPRに添付しない。

Accessでは[具体的なパスの設定が優先される](https://developers.cloudflare.com/cloudflare-one/access-controls/policies/app-paths/)。既存の `/internal/import/*` やホスト全体のポリシーは切り戻し用のパスには引き継がれないため、専用アプリの許可対象を明示する。取り込みトークンと通常のログインでは両方の抽出APIが拒否されることを確認する。

## 取得・計画

`v2/tools/migrate-from-supabase` で実行する。各出力先は未作成のディレクトリを指定し、親の `.migration-data` は先に作る。

```sh
bun run rollback export --url https://<v2-host> --writes-stopped --out ../../.migration-data/rollback-export
bun run rollback plan --source ../../.migration-data/cutover/source-snapshot.json --snapshot ../../.migration-data/rollback-export/v2-export.json --out ../../.migration-data/rollback-plan
```

v2で作ったユーザーを旧Authに対応づける場合は、`plan` / `images` / `apply` / `verify` のすべてに `--user-map <user-map.json>` を付ける（後述）。

D1と各DOを2回読み、一致を確認する。DO内はトランザクションで読み取り、削除済み行・変更ログも保存する。D1と全DOを横断した同時点の保証はないので、運用側での停止が必須。応答の上限は既存クライアントと同じ4 MiB。超過・途中失敗時は部分的なexportを完成扱いにしない。分割取得は今後の対応。DOスキーマはversion 3に限定する。

`report.json` に変更件数、台帳別の期待件数・金額・返礼状況、履歴の件数、ブロッカーと、停止はしないが旧DBに書かない値や運用で扱う対象（`notices`）を出す。`blocked` ならSQLを出さず終了コード1。`ready` なら `apply.sql` と `verify.sql` を生成する。計画内容を確認し、表示された `apply.sql` のSHA256を実行時に渡す。SQL内のJSONはSQL注入を防ぐためUTF-8のhexで格納する。暗号化ではない。

`sourceSha256` は空白・改行を含む元ファイルのSHA256で、移行時の `prepare` が保存した `plan.json` の値と一致することを確認する。

## 画像の逆転送

v2で追加・差し替えた画像だけを、R2から旧Storageの決定的なパスへ写す。移行時から変わらない画像は旧Storageの元の本体と参照をそのまま使う。

| 画像       | 旧バケット     | パス                                 | 旧DBの参照                                        |
| ---------- | -------------- | ------------------------------------ | ------------------------------------------------- |
| 返礼品画像 | `return-items` | `{旧台帳ID}/{作成者ID}/v2-{R2のID}`  | `return_items.image_url`（公開URL）               |
| 供物写真   | `offerings`    | `{作成者の旧ユーザーID}/v2-{写真ID}` | `offering_photos.storage_key`（バケット内のパス） |

`report.json` の `images` に転送対象を出す。`apply` の前に次を実行する。

```sh
bun run rollback images --source ../../.migration-data/cutover/source-snapshot.json --snapshot ../../.migration-data/rollback-export/v2-export.json --url https://<v2-host> --project-ref <legacy-project-ref> --writes-stopped --out ../../.migration-data/rollback-images
```

R2の本体は切り戻し専用の `/internal/import/rollback/files` から、`export` と同じAccessのサービストークンで読む。Workerは送信した本体のSHA-256を返し、R2に保存したハッシュとも照合する。旧Storageへは `SUPABASE_SECRET_KEY`（Secret key か service_role key）を環境変数で渡し、接続先は元スナップショットのproject refから作る。

各画像は、旧Storageを読んで同じ内容があれば書かず、なければ上書きなし（`x-upsert: false`）でアップロードし、読み戻してサイズとSHA-256を照合する。同じパスに違う内容があれば上書きせず `rollback_storage_conflict` で停止する。何度実行しても同じ結果になる。結果は `images.json` に出す。

`apply` は計画に画像があるとき `--images <images.json>` を要求し、同じ旧プロジェクト・元スナップショット・exportのすべての転送対象が照合済みでなければ `rollback_images_not_copied` で書き込まずに停止する。v2で削除・差し替えた画像の旧Storageの本体は消さず、旧DBの参照だけを外す。

## 書き戻し・照合

`psql` をPATHに入れる。[SupabaseのDirect connectionかSession pooler](https://supabase.com/docs/guides/database/connecting-to-postgres) の5432番ポートを使う。Transaction poolerは拒否する。

| 環境変数     | Direct connection                                     | Session pooler                        |
| ------------ | ----------------------------------------------------- | ------------------------------------- |
| `PGHOST`     | `db.<project-ref>.supabase.co`                        | Connect画面の `*.pooler.supabase.com` |
| `PGUSER`     | `postgres`                                            | `postgres.<project-ref>`              |
| `PGDATABASE` | `postgres`                                            | `postgres`                            |
| `PGPORT`     | `5432`                                                | `5432`                                |
| `PGPASSWORD` | 秘密の環境変数として設定                              | 同左                                  |
| `PGSSLMODE`  | 既定 `verify-full`。必要なCAを `PGSSLROOTCERT` で指定 | 同左                                  |

SSL無効は拒否する。接続先と元スナップショットのproject refを照合する。`PGHOSTADDR` / `PGSERVICE` 等の上書き設定は引き継がない。秘密はコマンド引数に含めない。

```sh
bun run rollback apply --source ../../.migration-data/cutover/source-snapshot.json --snapshot ../../.migration-data/rollback-export/v2-export.json --project-ref <legacy-project-ref> --approve-sha256 <planのSHA256> --images ../../.migration-data/rollback-images/images.json --writes-stopped --out ../../.migration-data/rollback-apply
bun run rollback verify --source ../../.migration-data/cutover/source-snapshot.json --snapshot ../../.migration-data/rollback-export/v2-export.json --project-ref <legacy-project-ref> --writes-stopped --out ../../.migration-data/rollback-verify
```

`apply` は入力からSQLを再生成し、SHA256を照合する。編集済みSQLを読み込む機能はない。計画が変わったら `plan` からやり直す。

publicの対象15テーブルをロックし（香典を削除する場合は `kouden_entry_audit_logs` / `kouden_entry_locks` も）、元の件数・ID・値を確認してから、1トランザクションで差分を反映する。認証テーブルには書かず、RLS・FK・業務トリガーを無効にしない。最後に全対象行の期待値を照合し、失敗したら全件を取り消す。DBが自動更新する `updated_at` / `last_modified_at` / `version` のみ事後の比較から外す。NULL、金額、生成列、元データの列は照合対象。

香典の書き込み直前に `request.jwt.claim.sub` を行ごとの実行者へトランザクション内だけ設定し、直後に元へ戻す。更新時は計画の `last_modified_by`、追加時は `created_by` を使う。旧 `auth.uid()` を読む監査トリガーが有効な場合でも、行ごとの更新者・作成者を記録でき、後続の別テーブルへ実行者を引き継がない。UUIDの実行者がない香典のSQLは生成しない。2026-10-14の実DBでは監査関数は存在するが香典へのトリガー接続はなく、リポジトリの旧スキーマでは接続されるため、両構成をテストする。

すでに期待値と一致していれば書かずに成功するので、同じ計画を再実行できる。`verify` は読み取り専用トランザクション。`passed` の確認後、追加・差し替えた画像の旧画面での表示と旧・新10冊の画面比較を行ってから旧アプリを再開する。`rollbackAccess` と取り込み用Access設定を空にして再デプロイし、専用サービストークンを失効させる。

接続切断で確定の有無が不明な場合も、まず同じ計画で `verify` する。psqlの生のstderrには個人情報が入り得るため、CLIには診断コードだけを表示する。

### 香典削除時の旧監査履歴・ロック

旧 `kouden_entry_audit_logs` と `kouden_entry_locks` は `entry_id` の FK が `ON DELETE CASCADE` で、移行スナップショットにも含まれない（移行対象外）。香典を削除する計画では、同じトランザクション内で、削除する香典の両テーブルの行を `kouden_rollback.deleted_entry_history`（`source_table`, `id`, `entry_id`, 元の行の `row_data`, `archived_at`）へ退避してから削除する。スキーマとテーブルは初回の適用時に作り、RLSを有効にしたうえで、`PUBLIC` と存在する `anon` / `authenticated` / `service_role` の権限を取り消す（RLSは所有者やBYPASSRLSのロールを制限しないため）。publicの外に置くため、旧アプリ・APIからは見えず、旧スキーマのFK・トリガーも変えない。削除後に退避した行と削除前の行を照合し、一致しなければ `rollback_verify_failed:deleted_entry_history` で全件を取り消す。旧スキーマの BEFORE DELETE 監査トリガーが削除時に書く `delete` 行は、旧アプリでの削除と同じくCASCADEで消える。退避した行は旧アプリへ戻さないため、必要な場合は運用者がSQLで参照する。退避の照合は `apply` のトランザクション内だけで行い、期待する行を計画が持たない `verify` では照合しない。

## オーナーの譲渡と編集者の権限

オーナーの譲渡は、`koudens` の `owner_id` と `created_by` の両方を新オーナーにする（#183）。旧DBの `created_by` は表示される作成者の履歴ではなく、認可の列として働いている。旧アプリ（`permissions.ts`）とRLSの多くは `owner_id` か `created_by` が一致すればオーナーとして扱い、`offering_allocations` のRLSは `created_by` だけで判定する。`owner_id` だけを書き戻すと、v2で編集者に降格・退会した元オーナーに管理権限が残り、新オーナーは按分を操作できない。両方を書き戻すと、元オーナーは編集者のメンバー行だけを持ち、v2と同じ権限になる。本番のRLSは変えない。

ただし旧RLSは、供物（`offerings`）と弔電（`telegrams`）では、行の `created_by` が一致するユーザーにも権限を与える（供物写真 `offering_photos` は、親の供物の `created_by` で判定する）。行の作成者は書き換えないので、v2で退会した、または閲覧者になった元オーナーが作った行がその冊にあると、切り戻し後も元オーナーはその行を参照・変更・削除できる。この場合は `former_owner_row_access_requires_mapping` で停止する。判定は元オーナー（旧 `owner_id` と旧 `created_by`）ごとに行い、新オーナー本人と、編集者として残る人は除く（編集者の権限に含まれるため）。一般メンバーの退会・閲覧者への変更でも同じく作成した行の権限は残るが、旧アプリで退会させた場合と同じ挙動なので停止しない。

旧DBの `created_by` は上書きされて失われるので、元の値を `report.json` の `notices`（`owner_transferred`、台帳ごとに `previousOwnerId` / `previousCreatedBy` / `ownerId`）に残す。元スナップショットと `pg_dump` にも残る。レポートは元スナップショットと一緒に保管する。

一般メンバーの編集者への追加・変更は、旧台帳の `editor` ロールで書き戻す。旧アプリが自分で招待した編集者と同じロールで、旧アプリの認可（`permissions.ts`）も `editor` で判定する。移行後に変更のない旧メンバー行は元のまま保持する。

実DBの弔電RLS（`telegrams` の INSERT / UPDATE / DELETE）と `offering_entries` の SELECT は、本番に1行もないロール名 `編集者` / `閲覧者` を要求している（#184）。RLSを `editor` / `viewer` に揃えるマイグレーション（`supabase/migrations/20261018010000_align_telegram_offering_entry_rls_role_names.sql`）を本番に適用する前と後で、書き戻した一般の編集者の権限は次のように違う。切り戻しのSQLはどちらでも同じ。

| 本番のRLS | 書き戻した一般の編集者                                                                                                                                                     |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 適用前    | 旧アプリで招待した編集者と同じく、弔電の追加・変更・削除と供物の紐づけの参照ができない。v2より権限が狭まるだけで、取りすぎは起きない。弔電の変更はオーナーに依頼してもらう |
| 適用後    | v2と同じ権限。旧アプリで招待した既存の編集者も弔電を変更できるようになる                                                                                                   |

切り戻しの前に、本番にマイグレーションを適用済みかを確認し、適用前なら該当の編集者への案内を準備する。

## 旧形式に構造のない記録

旧形式で表せない構造は、旧画面で読める形に落とし、構造はv2のexportとレポートに残す（#188）。備考に足す行は次の決まった形式にし、同じ行は二重に足さない（再移行した備考から再び切り戻す場合）。再移行のときに `transform.ts` がこの形式を読み取って元の構造に戻す処理は未実装。

| v2の記録                                       | 書き戻し方                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | `notices`                                                         |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------- |
| 返礼の削除                                     | 旧の返礼記録（`return_entry_records`）を削除する。旧画面は返礼記録のない香典を「未対応」と表示し、v2と一致する。他テーブルからのFKはなく、返礼金額は香典の側に残る                                                                                                                                                                                                                                                                                                                                           | なし                                                              |
| 供物の按分・紐づけの変更、按分のある供物の追加 | 負担額を `allocated_amount`、按分額÷供物の金額を `allocation_ratio`、代表者を `is_primary_contributor` として `offering_allocations` に書く。負担額のない差出人も含め、香典との紐づけを `offering_entries` に書く。負担額が変わらない按分は旧の比率を、旧行の `contribution_notes` はそのまま保ち、按分を消すときは、その按分の備考だけを、移行時と同じ `差出人: 備考` の形で旧の供物の備考に足す（残す按分の備考は二重にしない）。差出人に香典がない単独の供物は、紐づけを作らず `provider_name` だけにする | なし                                                              |
| 連名の香典                                     | 代表者を `kouden_entries` に書き、他の人を備考に `連名: 氏名、氏名`（氏名がなければ団体名）で足す。金額は香典の金額。代表者以外の住所などは書かない                                                                                                                                                                                                                                                                                                                                                          | `joint_koden_flattened`（代表者以外の差出人のID）                 |
| 同じ人の複数の香典                             | 香典ごとに旧の香典を作り、差出人の情報を写す。返礼・弔電・供物の紐づけは、旧の返礼記録がある香典、なければ最初に作った香典に付ける。旧の返礼金額は香典ごとの計算になり、v2の合計と違い得る                                                                                                                                                                                                                                                                                                                   | `person_has_multiple_koden`（香典の件数、返礼を付けた旧香典のID） |
| いただきもののない差出人                       | 書かない。旧形式に住所録がない                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | `person_without_gift`                                             |
| 行事                                           | 行事自体は書かない。既定の「葬儀」以外の行事のいただきものは、備考に `行事: 行事名` を足す                                                                                                                                                                                                                                                                                                                                                                                                                   | `event_not_rolled_back`（変更・追加・削除した行事）               |
| 金額帯ルール                                   | 有効な返礼品1品に1つだけの半返し（比率1/2）のルールは、その品の `recommended_amount_min` / `recommended_amount_max` に戻す。ルールがなくなった品と、ルールが別の品の半返しに移った品は空にする。それ以外のルールは書かず、旧の推奨額も変えない。旧の推奨額は画面の目安で、計算には使っていない                                                                                                                                                                                                               | `return_rule_not_rolled_back`                                     |

紐づけ（`offering_entries`）を変えると、旧DBのトリガーが動く。`update_has_offering_flag` が香典の `has_offering` を、返礼金額のトリガーが紐づく香典の `total_amount` を更新する。計画はこの結果を予測して照合し、SQLは `has_offering` を直接書かない。外した紐づけは返礼記録の更新より前に削除し、返礼記録の BEFORE トリガー（`tr_update_return_entry_total_amount`）が最終の紐づけで合計を計算するようにする。紐づけの削除で返礼金額を再計算しない構成（`20261018000000` の未適用時）でも合計が一致する。PGliteでは `update_has_offering_flag` を置き、`20261018000000` の返礼金額のトリガーの適用前と適用後の両方で照合している。旧スキーマの監査トリガー（`update_kouden_entry_modified`）を接続した構成では、トリガー経由の香典の更新で更新者が空になり、全体が取り消される想定（2026-10-14の本番には接続がない）。

## 旧画面に欄のない値

旧DBに列のない値は、旧画面で運用に使うものだけを備考に決まった形式で足し、それ以外はv2のexportに残す（#189）。旧DBにテーブルは足さない。移行時に作った値（台帳名から作った故人名、`shipped` の発送日＝最後に更新した日）は、変わっていなければ書かない。

| 値                          | 書き戻し方                                                                                                                                                                                                                                                                                  | `notices`                                                                  |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| 当日返し（`handed_on_day`） | `return_status = COMPLETED`（旧画面の表示は「完了」で、「発送済み」とは表示されない）と `return_method = on_day`。方法が当日でなければ、`remarks` に `【v2】当日返し済み` を足す                                                                                                            | なし                                                                       |
| 送付先の氏名（`shipName`）  | `remarks` に `【v2】送付先氏名: 氏名`                                                                                                                                                                                                                                                       | なし                                                                       |
| 発送日（`shippedAt`）       | `remarks` に `【v2】発送日: YYYY-MM-DD`。移行時に作った日付も、状況が発送済みでなくなった場合は残す（再移行では発送済みのときだけ日付を作るため）。手配日（`arrangement_date`）は上書きしない。発送済みのまま発送日を消した場合は、記録する欄がなく再移行で日付が作り直されるので一覧に出す | `shipped_date_cleared_not_rolled_back`（発送済みのまま発送日を消した返礼） |
| 返礼期限（`dueDate`）       | `remarks` に `【v2】返礼期限: YYYY-MM-DD`。旧アプリに通知はない                                                                                                                                                                                                                             | なし                                                                       |
| 読み仮名（`nameKana`）      | 書かない。旧画面の並べ替え・検索に使えない                                                                                                                                                                                                                                                  | `name_kana_not_rolled_back`（差出人のID）                                  |
| 故人名（`deceasedName`）    | 書かない。旧画面には台帳名（`title`）がある。再移行のときは故人名の確認の案内で、オーナーに確認してもらう                                                                                                                                                                                   | `deceased_name_not_rolled_back`（v2の台帳ID）                              |

書かない値は、v2のexport（`v2-export.json`）を元スナップショット・レポートと一緒に保管し、再移行の際に照合する。再移行の変換（`transform.ts`）が `【v2】` の行を読み取って元の欄に戻す処理と、`COMPLETED` かつ方法が当日の返礼を `handed_on_day` に写す処理は未実装。

## 切り替え後に作った香典帳・ユーザー・購入

切り替え後にv2で作った香典帳は旧形式に戻さない（#186）。旧DBで香典帳を作るとトリガーがロール・オーナーのメンバー行・既定の関係・配送方法を作り、旧アプリは無料の冊を14日で期限切れにするなど、旧形式で作り直すと検証できない差が重なる。これらの冊は旧アプリで使われたことがない。CLIは停止せず、`report.json` の `notices` に一覧を出す。

| `notices` のコード                     | 対象                                                     | 運用                                                                                                                                                                 |
| -------------------------------------- | -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `new_book_not_rolled_back`             | v2で作った冊（v2のID）                                   | データはv2のexportとD1・DOのバックアップに残る。必要ならv2のデータとして書き出し（Excel・印刷）、オーナーに渡す                                                      |
| `purchase_not_rolled_back`             | 移行した冊以外の購入（冊のID、`source`、`status`、金額） | 旧DBに戻す先がない（旧アプリに管理画面から有料化する機能はない）。Stripeで返金するか、v2の再開まで保留するかを利用者ごとに決める                                     |
| `deleted_book_requires_manual_cleanup` | v2で削除した移行済みの冊（旧ID）                         | CLIは旧DBで消さない。旧アプリの再開後に、旧アプリの香典帳の削除処理で消す（招待・メンバー・ロールは旧DBのトリガー `cleanup_kouden_related_data`、供物写真はStorage） |
| `new_user_not_rolled_back`             | 移行した冊から参照されない、v2で作ったユーザー           | 旧Authに作らない                                                                                                                                                     |
| `new_user_mapped`                      | `--user-map` で旧Auth IDを対応づけたユーザー             | 下記                                                                                                                                                                 |

移行した冊のメンバー・招待者・作成者として、v2で作ったユーザーが参照されている場合は、旧AuthのIDを明示的に対応づける。対応表がなければ `unmapped_user` で停止する。

1. 対象のユーザー（`unmapped_user` の `entityId`）ごとに、Supabase Admin API（`auth.admin.createUser`）で旧Authのユーザーを作る。メールはv2の登録と同じものを使い、作成後に旧DBのトリガー `handle_new_user` が `profiles` の行を作ったことを確認する。
2. Admin APIが同じメールの既存ユーザーを理由に作成を拒んだ場合は、既存ユーザーに寄せず、本人の2つのアカウントの扱いを決めるまで切り戻しを止める。exportにはメールがないので、CLIはメールで照合しない。
3. 非公開ディレクトリに `user-map.json` を置き、`plan` / `images` / `apply` / `verify` に同じものを `--user-map` で渡す。

```json
[{ "v2UserId": "<v2のユーザーID>", "legacyUserId": "<Admin APIで作った旧AuthのUUID>" }]
```

CLIは、v2で作った削除されていないユーザーだけを、既存の旧Auth・`profiles` にないUUIDへ、1対1で対応づけることを検査し、違反は `rollback_user_map_invalid` で停止する。SQLは対応づけたユーザーの `profiles` の行が存在することを前提照合し（表示名以外の値は照合しない）、表示名をv2の値にする。Authユーザーを作る前に `apply` すると `rollback_precondition_failed` で何も書かずに止まる。

v2で削除したユーザーは `user_identity_or_deletion` で停止したままにする。

移行した冊の購入は、移行時の購入と一致し、冊が有料のままであることを照合する。返金や新しい購入があれば `billing_requires_manual_reconciliation` で停止する。

## 停止条件と残作業

ブロッカーをJSONから消して実行してはいけない。対応を実装し、隔離環境で確認してから再計画する。

招待者不明のメンバー追加・招待者の削除は、旧 `added_by` が必須のため `member_inviter_requires_mapping` で停止する。返礼品目の削除も、v2への移行時に省略した旧明細からの参照が残っていれば `delete_has_legacy_dependents` で停止する。香典の削除も、旧供物の紐付け・按分・弔電・返礼記録から参照されていれば同じコードで停止する。

| 主なコード・フィールド                                                                            | 必要な対応                                                                                                                                                                                                                                                 |
| ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `unmapped_user`                                                                                   | v2で作ったユーザーの旧Auth IDを `--user-map` で渡す（前節）。メールだけで推測しない                                                                                                                                                                        |
| `user_identity_or_deletion`                                                                       | 移行したユーザーの旧IDの変更・v2での削除。旧Authとメンバーの削除手順                                                                                                                                                                                       |
| `billing_requires_manual_reconciliation`                                                          | 移行した冊の新規購入・返金と旧プランの照合                                                                                                                                                                                                                 |
| `photo_requires_offering` / `image_outside_book`                                                  | 香典・弔電への写真、別の台帳の画像キーの扱い                                                                                                                                                                                                               |
| `rollback_storage_conflict` / `rollback_storage_verify_failed` / `rollback_image_source_mismatch` | 旧Storageの同じパスにある本体、転送途中の破損、R2の本体を調べる。上書きで回避しない                                                                                                                                                                        |
| `former_owner_row_access_requires_mapping`                                                        | 譲渡後に編集者として残らない元オーナーが、供物・弔電（供物写真は親の供物）を作っている。v2で元オーナーを編集者に戻してから切り戻すか、行の作成者の扱いを決める（行の `created_by` の書き換えは未実装）                                                     |
| `koden_representative_changed`                                                                    | 移行した香典の代表者をv2で別の人に替え、旧の香典に前の代表者の返礼記録・供物の紐づけ・按分・弔電が付いている。そのまま書くと前の代表者の記録が新しい代表者に付け替わる。v2で代表者を戻すか、旧画面で付け替えてから再計画する                               |
| `offering_contributor_without_koden`                                                              | 香典のある差出人とない差出人の連名の供物、または香典のない差出人の按分。旧形式では香典のない人を按分・紐づけに書けない。v2で差出人を見直すか、旧画面で入力し直す                                                                                           |
| `merged_return_requires_manual_mapping` / `legacy_return_lines_require_manual_mapping`            | 1つの香典に旧の返礼記録が複数ある、または旧明細（`return_record_items`）がある返礼の変更・削除。本番では0件（2026-10-18確認。複数記録0件、旧明細0行）のため実装せず、安全のための停止として残す。発生したら、旧画面で返礼記録を1件に整理してから再計画する |
| `deleted_return_requires_manual_cleanup`                                                          | 旧香典に「返礼済み」の印（`is_return_completed`）がある返礼の削除。旧の返礼記録がない場合も、ある場合も対象（記録を消しても旧画面は印で返礼済みと表示する）。印の扱いを決め、旧画面で直す                                                                  |
| `delete_has_legacy_dependents`                                                                    | 旧連携データも含む削除計画                                                                                                                                                                                                                                 |
| `rollback_precondition_failed`                                                                    | 旧DBが変わった理由を調べ、双方の変更を調停。元スナップショットの差し替えで回避しない                                                                                                                                                                       |
| `rollback_verify_failed` / `rollback_database_failed`                                             | 制約・トリガーとの差異を隔離DBで調査。失敗したSQLは確定しない                                                                                                                                                                                              |

## 検証範囲

PGliteのPostgreSQLに、確認した旧スキーマの型・生成列・関連FK・返礼合計トリガーのfixtureを作り、追加・更新・削除・再実行、NULL・引用符、前提不一致、トリガーによる事後不一致、FK失敗時の取り消しをテストする。Workerでは認証拒否、no-store、削除済み行と変更履歴の取得を確認する。

香典の削除では、旧スキーマの監査ログ・ロックのテーブルを置き、BEFORE DELETE 監査トリガーの有無の両方で、退避・照合・再実行と、照合失敗時に監査ログ・ロックが残ることを確認している。

2026-10-13の保存済み抽出データ38人・40冊では、初期投入状態を再現したexportに対して変更0件・ブロッカー0件を確認した。画像の逆転送は、R2の取得口をWorkerのテストで、旧Storageへの転送・照合・再実行・内容の衝突をStorage APIのfakeで、参照の書き戻しをPGliteで確認している。実Supabaseへの書き込み、psqlでのリモート接続、実R2・実Storageでの逆転送と旧画面での表示は未実施。本番の切り戻し完了を示すものではない。
