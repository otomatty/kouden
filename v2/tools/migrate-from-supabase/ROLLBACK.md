# v2 から旧 Supabase へ書き戻す

一般公開後の切り戻し用 CLI。最終移行時のスナップショットと、書き込みを停止した v2 を比較し、旧形式に戻せる差分を SQL にする。通信しない `plan`、明示的に書き込む `apply`、読み取り専用の `verify` に分ける。

この版は移行済みの香典帳を対象にする。新規ユーザー・新規香典帳や画像の逆転送など、未対応の変更が1件でもあれば全体を停止する。ブロッカーの解消、隔離した Supabase でのリハーサル、画面比較が終わるまでは、本番切り戻しの準備完了と扱わない。

## 対応する変更

- 既存ユーザーの表示名、台帳名・状態、既存ユーザー間のメンバー変更。旧ロールがない場合は停止する。
- 関係・返礼品カタログの追加・更新と、参照を解除した行の削除。
- 単独差出人の香典、独立した供物・供花、弔電の追加・更新。
- 旧形式で表せる返礼状況・金額・送付先・備考・JSON明細。合計と生成列は旧DBの式で計算する。
- 旧環境の依存行がない供物・弔電の削除。紐づかない差出人が残る場合は停止する。

変わらなかった値には元スナップショットの値を使う。前後の空白、台帳・関係の説明、元の供物分類、未移行の列を保持する。追加行のIDはv2のIDから決定的に作る。変更履歴・受付番号など旧画面にない運用情報はexport側に残す。

### 返礼金額のDB定義

2026-10-14にSupabaseコネクタで実DBの関数・トリガー定義を読み取り確認した。`return_entry_records` の `tr_update_return_entry_total_amount` は INSERT / UPDATE 前に `calculate_total_amount` を呼び、`total_amount` を香典額＋紐づく供物の `price * quantity` に設定する。旧明細の合計は `calculate_return_items_cost` が `return_items_cost` に反映する。切り戻し計画はこの実DBの定義を使う。

リポジトリの `supabase/migrations/20260616000000_atomize_return_entry_record_total_amount.sql` は明細合計を `total_amount` に設定するが、実DBにはその関数・トリガーがなく、このファイルも上記の BEFORE トリガーを削除しない。両トリガーがある場合も親の更新時に香典＋供物へ戻ることをPostgreSQLテストで確認している。実DBとマイグレーションの定義の統一は別途必要。隔離環境でのリハーサルではトリガー定義も比較し、計算式を変更したDBにそのまま適用しない。適用後の値が計画と異なる場合は、照合エラーによりトランザクション全体を取り消す。

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

D1と各DOを2回読み、一致を確認する。DO内はトランザクションで読み取り、削除済み行・変更ログも保存する。D1と全DOを横断した同時点の保証はないので、運用側での停止が必須。応答の上限は既存クライアントと同じ4 MiB。超過・途中失敗時は部分的なexportを完成扱いにしない。分割取得は今後の対応。DOスキーマはversion 3に限定する。

`report.json` に変更件数、台帳別の期待件数・金額・返礼状況、履歴の件数、ブロッカーを出す。`blocked` ならSQLを出さず終了コード1。`ready` なら `apply.sql` と `verify.sql` を生成する。計画内容を確認し、表示された `apply.sql` のSHA256を実行時に渡す。SQL内のJSONはSQL注入を防ぐためUTF-8のhexで格納する。暗号化ではない。

`sourceSha256` は空白・改行を含む元ファイルのSHA256で、移行時の `prepare` が保存した `plan.json` の値と一致することを確認する。

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
bun run rollback apply --source ../../.migration-data/cutover/source-snapshot.json --snapshot ../../.migration-data/rollback-export/v2-export.json --project-ref <legacy-project-ref> --approve-sha256 <planのSHA256> --writes-stopped --out ../../.migration-data/rollback-apply
bun run rollback verify --source ../../.migration-data/cutover/source-snapshot.json --snapshot ../../.migration-data/rollback-export/v2-export.json --project-ref <legacy-project-ref> --writes-stopped --out ../../.migration-data/rollback-verify
```

`apply` は入力からSQLを再生成し、SHA256を照合する。編集済みSQLを読み込む機能はない。計画が変わったら `plan` からやり直す。

publicの対象15テーブルをロックし、元の件数・ID・値を確認してから、1トランザクションで差分を反映する。認証テーブルには書かず、RLS・FK・業務トリガーを無効にしない。最後に全対象行の期待値を照合し、失敗したら全件を取り消す。DBが自動更新する `updated_at` / `last_modified_at` / `version` のみ事後の比較から外す。NULL、金額、生成列、元データの列は照合対象。

すでに期待値と一致していれば書かずに成功するので、同じ計画を再実行できる。`verify` は読み取り専用トランザクション。`passed` の確認後、画像の保全確認と旧・新10冊の画面比較を行ってから旧アプリを再開する。`rollbackAccess` と取り込み用Access設定を空にして再デプロイし、専用サービストークンを失効させる。

接続切断で確定の有無が不明な場合も、まず同じ計画で `verify` する。psqlの生のstderrには個人情報が入り得るため、CLIには診断コードだけを表示する。

## 停止条件と残作業

ブロッカーをJSONから消して実行してはいけない。対応を実装し、隔離環境で確認してから再計画する。

オーナー変更は `owner_transfer_requires_manual_mapping` で停止する。旧アプリとRLSは `owner_id` に加え `created_by` にも管理権限を与えるため、所有者だけを更新すると、v2で降格・退会した元オーナーに管理権限が残る。作成者の履歴を上書きして回避せず、旧側の認可とメンバー権限を整合する手順ができるまでSQLを生成しない。

香典の削除は `deleted_entry_requires_manual_cleanup` で停止する。旧 `kouden_entry_audit_logs` やロックは移行スナップショットに含まれず、旧香典行を消すとCASCADEで削除される。旧履歴の保全・照合を含む手順ができるまでは、参照なしに見える香典も削除SQLを生成しない。

返礼期限 `dueDate` がある場合は旧形式に保存先がないため停止する。招待者不明のメンバー追加・招待者の削除は、旧 `added_by` が必須のため `member_inviter_requires_mapping` で停止する。返礼品目の削除も、v2への移行時に省略した旧明細からの参照が残っていれば `delete_has_legacy_dependents` で停止する。

| 主なコード・フィールド                                                                                                            | 必要な対応                                                                           |
| --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `new_book_requires_mapping` / `user_identity_or_deletion` / `unmapped_user`                                                       | 旧Auth ID、旧plan ID、初期ロール等の明示的な対応づけ。メールだけで推測しない         |
| `deleted_book_requires_manual_cleanup`                                                                                            | 招待・領収書・他スキーマも含む削除手順                                               |
| `billing_requires_manual_reconciliation`                                                                                          | 新規購入・返金と旧プランの照合                                                       |
| `deceasedName` / `nameKana` / `shipName` / `shippedAt` / `status`                                                                 | 旧画面に対応欄・状態のない値の保全・表示方針。当日渡しを発送済みに置き換えない       |
| `events_require_manual_mapping` / `return_rules_require_manual_mapping`                                                           | 行事・日付・金額帯ルールの対応づけ                                                   |
| `images_require_reverse_copy` / `imageR2Key`                                                                                      | R2から旧Storageへの逆転送とサイズ・ハッシュ照合                                      |
| `koden_requires_single_person` / `person_has_multiple_koden` / `person_without_gift`                                              | 連名、同一差出人の複数香典、紐づかない差出人の保全                                   |
| `offering_allocation_changed` / `new_offering_allocation_requires_mapping`                                                        | 按分額・比率・備考と旧トリガーの整合性                                               |
| `merged_return_requires_manual_mapping` / `legacy_return_lines_require_manual_mapping` / `deleted_return_requires_manual_cleanup` | 統合返礼、旧明細テーブル、返礼削除の対応                                             |
| `delete_has_legacy_dependents`                                                                                                    | 旧連携データも含む削除計画                                                           |
| `rollback_precondition_failed`                                                                                                    | 旧DBが変わった理由を調べ、双方の変更を調停。元スナップショットの差し替えで回避しない |
| `rollback_verify_failed` / `rollback_database_failed`                                                                             | 制約・トリガーとの差異を隔離DBで調査。失敗したSQLは確定しない                        |

## 検証範囲

PGliteのPostgreSQLに、確認した旧スキーマの型・生成列・関連FK・返礼合計トリガーのfixtureを作り、追加・更新・削除・再実行、NULL・引用符、前提不一致、トリガーによる事後不一致、FK失敗時の取り消しをテストする。Workerでは認証拒否、no-store、削除済み行と変更履歴の取得を確認する。

2026-10-13の保存済み抽出データ38人・40冊では、初期投入状態を再現したexportに対して変更0件・ブロッカー0件を確認した。実Supabaseへの書き込み、psqlでのリモート接続、Storageの逆転送は未実施。本番の切り戻し完了を示すものではない。
