# 05. 移行計画

## 1. 実装マイルストーン

各マイルストーンの終わりにステージングへデプロイし、動作を確認する。

| # | マイルストーン | 内容 | 対応ストーリー |
|---|---|---|---|
| M0 | 基盤 | ドメイン取得、Cloudflare リソース作成、モノレポ・`cf`・CI、Tailwind・レイアウト、Google ログイン・セッション、公開サイトの骨格 | E1-1, E1-3, E11 |
| M1 | 台帳の骨格 | 香典帳の作成・一覧、`KoudenLedger` DO（マイグレーション機構・変更ログ）、行事・関係、いただきもの・差出人の CRUD、受付番号、受付画面、合計 | E2, E4-1〜6, E5-1, E5-3, E7-1 |
| M2 | 共同編集 | メンバー・招待リンク・ロール、WebSocket による同期・編集中表示・競合検出、変更履歴、オーナー譲渡、退出 | E3, E8 |
| M3 | 香典返し | カタログ（R2 画像）、金額帯ルール、一括提案、状況管理、リマインド（DO アラーム + Email Service） | E6 |
| M4 | 出力・課金 | 印刷用ページ、Excel（ライブラリ PoC を先に実施）、Stripe 購入・Webhook・無料版の上限 | E7-2, E7-3, E9 |
| M5 | 運営・仕上げ | 運営者 Worker（Access）、統計の投影・ダッシュボード、旧ユーザーの手動紐づけ、アカウント削除、オフライン警告、アクセシビリティ確認、E2E | E1-4, E1-5, E4-8, E10 |
| M6 | 移行 | 移行ツール、ステージングでのリハーサル（2 回以上）、本番の切り替え | E1-2 |

切り替え後に「後続」のストーリー（E4-7 供物の写真の新規追加、E5-2 差出人の統合）を実装する。ただし、旧データの供物写真は M6 で移行する。

## 2. データ移行の全体像

```mermaid
flowchart LR
  sb[("Supabase<br/>PostgreSQL + Storage")] -->|1. 抽出| snap["スナップショット<br/>（JSON / 香典帳ごと）"]
  snap -->|2. 変換<br/>packages/domain を使用| plan["移行データ<br/>D1 用 SQL + DO 用 JSON"]
  plan -->|3a. D1 へ投入| d1[("D1")]
  plan -->|3b. 取り込み API| do["KoudenLedger DO"]
  sb -->|3c. 画像コピー| r2[("R2")]
  d1 & do & r2 -->|4. 検証| report["検証レポート"]
```

ツールは `v2/tools/migrate-from-supabase/` に置き、Bun で実行する。各段階は**冪等**（何度実行しても同じ結果）にする。

| 段階 | 処理 |
|---|---|
| 1. 抽出 | Supabase の service key で全テーブルを読み、香典帳ごとの JSON にまとめる。Storage のオブジェクト一覧も取る |
| 2. 変換 | §3 の対応表に従って新しい形に変換する。ID は旧 UUID から決定的に生成（UUIDv5）し、再実行しても同じ ID になるようにする |
| 3a. D1 投入 | `cf d1 query`（または D1 の HTTP API）で `users` / `legacy_users` / `koudens` / `kouden_members` / `purchases` を投入（`INSERT OR REPLACE`） |
| 3b. DO 投入 | 移行専用の内部エンドポイント `POST /internal/import/:koudenId`（Access サービストークンで保護。移行完了後に無効化）経由で `stub.importSnapshot(json)` を呼ぶ。DO は中身を全消去してから入れ直す |
| 3c. 画像 | Supabase Storage（`return-items`、供物写真）から R2 の `koudens/{koudenId}/…` へコピー |
| 4. 検証 | §5 の項目を香典帳ごとに比較し、1 件でも不一致があれば失敗にする |

## 3. 対応表（旧 → 新）

### ユーザー

| 旧 | 新 | 変換ルール |
|---|---|---|
| `auth.users` + `profiles` | D1 `users` | `legacy_user_id` = 旧 ID。`display_name` は `profiles.display_name`。アバターは移行しない（Google の画像を使う） |
| `auth.identities`（provider = google） | `users.google_sub` | `provider_id`（= Google の `sub`）をそのまま設定する。**Google ログインのユーザーは初回ログインで確実に紐づく** |
| `auth.identities`（provider = email） | `users.google_sub = NULL` + `legacy_users` | 初回の Google ログイン時に確認済みメールが一致すれば自動で紐づく。一致しなければ運営者が手動で紐づける |

### 香典帳とメンバー

| 旧 | 新 | 変換ルール |
|---|---|---|
| `koudens` | D1 `koudens` + DO `meta` | `deceased_name` は旧データにないので `title` から仮に設定し、初回表示時にオーナーへ確認を促す。`plan` はすべて `paid`（ADR-P10）。`status` はそのまま |
| `kouden_members` + `kouden_roles` | D1 `kouden_members.role` | `koudens.owner_id` の人 → `owner`。ロールの `permissions` に `edit` を含む → `editor`。それ以外 → `viewer` |
| `kouden_invitations` | 移行しない | 保留中の招待は切り替え後に再発行してもらう（告知文に記載） |
| `kouden_purchases` | D1 `purchases` | `source = 'legacy'`、`status = 'paid'`、`stripe_checkout_session_id` は旧値を保持 |

### 台帳（DO）

| 旧 | 新 | 変換ルール |
|---|---|---|
| — | `events` | 香典帳ごとに既定の行事「葬儀」を 1 件作成し、旧データはすべてここに入れる。受付番号は付けない（`receipt_no = NULL`） |
| `relationships` | `relationships` | そのまま |
| `kouden_entries` | `persons` + `gifts`（`kind = 'koden'`）+ `gift_contributors` | **1 件 = 1 人**として差出人を作る（自動での名寄せはしない。誤った統合を避けるため）。`attendance_type`: `FUNERAL` → `attended`、`CONDOLENCE_VISIT` → `condolence_visit`、`ABSENT` → `absent` |
| `offerings` | `gifts`（`kind` は `type` から `kumotsu` / `kyoka` / `other` に写像） | `provider_name`、`description`、`quantity`、`price`（→ `amount`）、`notes` を移す |
| `offering_allocations` / `offering_entries` | `gift_contributors` | 紐づく香典の差出人を供物の差出人にする。`allocated_amount` → `share_amount`、`is_primary_contributor` → `is_primary`。紐づきがなければ `provider_name` で差出人を新規作成 |
| `offering_photos` | `gift_photos` + R2 | 画像を R2 にコピーし、キーを書き換える |
| `telegrams` | `gifts`（`kind = 'choden'`） | `message` → `message`。`kouden_entry_id` があればその差出人に、なければ `sender_*` から差出人を新規作成 |
| `return_items` | `return_items` | 画像を R2 にコピー。`recommended_amount_min/max` は `return_rules` の初期値にする（比率は 1/2） |
| `return_entry_records` | `returns` | 差出人単位に集約。`return_status`: `PENDING` → `pending`、`PARTIAL_RETURNED` → `arranged`、`COMPLETED` → `shipped`、`NOT_REQUIRED` → `not_required`。送付先・手配日・備考を移す |
| `return_record_items` | `return_lines` | 品名・単価はカタログからのスナップショット |
| `kouden_entry_audit_logs` | 移行しない | 変更ログには `op = 'import'` の 1 行だけを記録する |

### 移行しないもの

`admin_*`、`support_tickets` / `ticket_messages`、`system_announcements` / `announcements` / `user_announcement_reads`、`notifications`、`user_settings`、`user_surveys` / `user_survey_skips`、`campaign_hearing_applications`、`contact_requests`、`login_attempts`、`security_logs`、`debug_logs`、`kouden_entry_locks`。

これらは切り替え時に `pg_dump` で全体のバックアップを取り、アクセス制限付きの保管場所に 1 年間保存する。

> **事前確認**: 型定義には `common` / `gift` / `funeral` スキーマも存在する。アプリからは参照されていないが、本番にデータが入っていないかを抽出の前に確認する。

## 4. 移行前の準備

| 時期 | 作業 |
|---|---|
| M0 | 本番 Supabase の件数を調査する（ユーザー数、Google / メールの内訳、香典帳数、最大の香典帳の件数、Storage の容量）。移行時間の見積もりに使う |
| M6 開始時 | 本番のスナップショットでステージングへのリハーサルを行う。**リハーサル用のデータは個人情報を含むため、ステージング（Access で保護）でのみ扱い、リハーサル後に削除する** |
| 切り替え 14 日前 | 旧アプリにバナーとメールで告知する（停止日時、Google ログインへの一本化、メールログインの人への案内、保留中の招待は再発行が必要なこと） |
| 切り替え 3 日前 | 最終リハーサル。所要時間を計測し、停止時間を確定する |

## 5. 検証項目

香典帳ごとに旧と新で比較し、すべて一致したら合格とする。

| 項目 | 旧 | 新 |
|---|---|---|
| 香典の件数・合計金額 | `kouden_entries` | `gifts`（`kind = 'koden'`） |
| 供物・弔電の件数 | `offerings` / `telegrams` | `gifts`（該当する `kind`） |
| 香典返しの件数・状況別件数 | `return_entry_records` | `returns` |
| 返礼品の件数 | `return_items` | `return_items` |
| メンバー数・オーナー | `kouden_members` / `koudens.owner_id` | D1 `kouden_members` |
| 画像の件数・サイズ | Storage のオブジェクト | R2 のオブジェクト |
| 全ユーザー | `auth.users` の件数 | `users` の件数 |

加えて、ランダムに抽出した 10 冊について、旧アプリと新アプリの画面を目視で比較する。

## 6. 切り替え手順（当日）

| 時刻 | 作業 | 失敗したら |
|---|---|---|
| T-0:00 | 旧アプリをメンテナンスモードにする（Vercel の環境変数でメンテナンス画面を表示し、書き込みを止める） | — |
| T+0:10 | 最終の抽出と `pg_dump` のバックアップ | 中止し、メンテナンスを解除 |
| T+0:30 | 変換 → D1 投入 → DO 投入 → 画像コピー | 本番の D1・DO・R2 を空にして再実行、または中止 |
| T+1:30 | 検証レポートの確認、目視確認 | 中止し、メンテナンスを解除（旧データは変更していないので戻せる） |
| T+2:00 | 内部の取り込みエンドポイントを無効化。新アプリを公開。旧ドメインから新ドメインへ 301 リダイレクト | 新アプリを非公開に戻し、メンテナンスを解除 |
| T+2:30 | 運営者アカウントでログインを確認、テスト用香典帳で登録・同期・購入（テストモード）を確認 | — |

**中止の判断基準**: 検証で 1 件でも不一致がある、または予定時間を 1 時間以上超過した場合は中止して旧アプリに戻す。旧アプリのデータはメンテナンス中に変更しないので、メンテナンスを解除するだけで元に戻る。

## 7. 切り替え後

| 時期 | 作業 |
|---|---|
| 当日〜7 日 | ログイン・紐づけ失敗の問い合わせに対応（運営者画面で手動紐づけ）。エラーログを毎日確認 |
| 30 日後 | 未ログインの旧ユーザー数を確認し、メールログインだった人へ個別に案内 |
| 90 日後 | Supabase プロジェクトを一時停止。Vercel プロジェクトを削除（旧ドメインのリダイレクトは継続） |
| 1 年後 | `pg_dump` のバックアップを削除。Supabase プロジェクトを削除 |
| 切り替え後すぐ | `legacy-nextjs` タグを打ち、旧実装のコードを `main` から削除。`AGENTS.md` を新構成に合わせて書き直す |
