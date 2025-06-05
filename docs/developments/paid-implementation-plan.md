# 有料化機能実装計画

## 1. 目的
- 香典帳の無料閲覧期間を「作成から14日間」に制限し、期限切れ後は購入済みプランでのみ閲覧可能にする
- 提供プラン：
  - free（無料プラン）
  - basic（ベーシックプラン）
  - premium（プレミアムプラン）
  - premium_full_support（プレミアム＋フルサポートプラン）

## 2. データベース設計

### 2.1 plans テーブル
ファイル: `database/plans.sql`
```sql
CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,       -- 'free','basic','premium','premium_full_support'
  name TEXT NOT NULL,             -- 表示用プラン名
  description TEXT,               -- プラン説明
  price INTEGER NOT NULL,         -- 価格（円）
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);
CREATE INDEX IF NOT EXISTS idx_plans_code ON plans(code);
```

### 2.2 kouden_purchases テーブル
ファイル: `database/kouden_purchases.sql`
```sql
CREATE TABLE IF NOT EXISTS kouden_purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kouden_id UUID NOT NULL REFERENCES koudens(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  plan_id UUID NOT NULL REFERENCES plans(id),
  expected_count INTEGER,  -- プレミアム+フルサポート時の予想件数
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT uq_kouden_user_plan UNIQUE (kouden_id, user_id, plan_id)
);
CREATE INDEX IF NOT EXISTS idx_kouden_purchases_kouden ON kouden_purchases(kouden_id);
CREATE INDEX IF NOT EXISTS idx_kouden_purchases_user ON kouden_purchases(user_id);
```

### 2.3 RLS ポリシー修正
ファイル: `database/koudens.sql` の SELECT ポリシーを以下のように修正
```sql
USING (
  (koudens.created_at + INTERVAL '14 days' > NOW())
  OR koudens.plan_id <> (SELECT id FROM plans WHERE code = 'free')
  OR EXISTS (
    SELECT 1
      FROM kouden_members km
     WHERE km.kouden_id = koudens.id
       AND km.user_id = auth.uid()
  )
  OR koudens.owner_id = auth.uid()
)
```

### 2.4 koudens テーブルへの plan_id カラム追加
ファイル: `database/koudens.sql`
```sql
ALTER TABLE koudens
  ADD COLUMN plan_id UUID REFERENCES plans(id);
-- 既存データのバックフィル: freeプランIDを設定
UPDATE koudens
  SET plan_id = (SELECT id FROM plans WHERE code = 'free');
ALTER TABLE koudens
  ALTER COLUMN plan_id SET NOT NULL;
-- インデックス追加
CREATE INDEX IF NOT EXISTS idx_koudens_plan ON koudens(plan_id);
```
- 新規作成時は Server Actions 側で free プランの plan_id を設定

## 3. SQLエディターでの実行
- Supabase管理画面のSQLエディターを開き、以下の順番でSQLを実行してください。
  1. `database/plans.sql` の内容をコピー＆ペーストして実行
  2. `database/kouden_purchases.sql` の内容をコピー＆ペーストして実行
     - テーブル作成後に以下を実行し、UNIQUE制約を追加:
       ```sql
       ALTER TABLE kouden_purchases
         ADD CONSTRAINT uq_kouden_user_plan UNIQUE (kouden_id, user_id, plan_id);
       ```
  3. RLSポリシー更新（`database/koudens.sql` のSELECT USING句に以下を追加）:
     ```sql
     -- 既存の USING(...) の末尾に OR koudens.owner_id = auth.uid() を追加
     ```
  4. `koudens` テーブルに `plan_id` を追加・バックフィル・NOT NULL設定・インデックス作成:
     ```sql
     ALTER TABLE koudens ADD COLUMN plan_id UUID REFERENCES plans(id);
     UPDATE koudens SET plan_id = (SELECT id FROM plans WHERE code = 'free');
     ALTER TABLE koudens ALTER COLUMN plan_id SET NOT NULL;
     CREATE INDEX IF NOT EXISTS idx_koudens_plan ON koudens(plan_id);
     ```
  5. 通知テーブル定義更新（`database/notifications.sql` の内容をコピー＆ペーストして実行）:
     ```sql
     CREATE TABLE IF NOT EXISTS notifications (
       id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
       event_id TEXT UNIQUE NOT NULL,
       kouden_id UUID NOT NULL REFERENCES koudens(id),
       user_id UUID NOT NULL REFERENCES auth.users(id),
       notification_type TEXT NOT NULL
         CHECK (notification_type IN ('receipt','reminder_before','reminder_after')),
       sent_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
       metadata JSONB
     );
     ```
  6. `scripts/seed_plans.sql` の内容をコピー＆ペーストして初期プランをシード

※ 各SQLスクリプトはリポジトリ内の対応ファイルから取得し、SQLエディターに貼り付けて実行してください。

## 4. API 設計

### 4.1 プラン一覧取得
- GET `/api/plans`
  - 認証不要
  - 全プランを返却

### 4.2 購入エンドポイント
- POST `/api/koudens/:koudenId/purchase`
  - 認証必須
  - リクエストボディ: `{ planCode: string }`
  - 処理フロー:
    1. `plans` テーブルから `planCode` を検証
    2. Stripe Checkout セッションを生成し、クライアントへリダイレクトURLを返却
    3. Webhook で決済完了を検知し、`kouden_purchases` にレコードを挿入
  - 重複購入防止: 同一ユーザー・同一香典帳・同一プランの2重購入を禁止

### 4.3 エラーレスポンスとドキュメント
- エラーレスポンスは以下のJSON形式で統一:
  ```json
  {
    "error": {
      "code": string,
      "message": string,
      "details"?: any
    }
  }
  ```
- Rate Limiting: 全エンドポイントに 429 を設定し、必要に応じて再試行ヘッダーを付与
- 認証失敗時は 401、権限不足時は 403 を返却
- OpenAPI (Swagger) で API 定義を `openapi.yaml` に記述し、自動生成ドキュメントを提供

## 5. アクセス制御（バックエンド）
- Server Actions / API（Edge Function）で以下をチェック
  - `koudens.plan_id` が `free` 以外の場合は常に許可
  - 作成から14日以内の場合は許可
  - または メンバー／オーナー権限を保有
- いずれも満たさない場合は HTTP 403 を返却

## 6. フロントエンド実装（Next.js + Server Actions）
- Server Actions を使用してデータフェッチと操作を行う
  - `app/_actions/getPlans.ts` でプラン一覧取得
  - `app/_actions/createKouden.ts` で新規香典帳作成時に free プラン設定
  - `app/_actions/purchaseKouden.ts` で購入処理（Stripe セッション生成）
- React Server Component や Client Component から直接 Server Actions を呼び出し
- コンポーネント例:
  ```tsx
  'use client'
  import { purchaseKouden } from '@/app/_actions/purchaseKouden'
  import { revalidatePath } from 'next/cache'

  function PurchaseButton({ koudensId, planCode }: { koudensId: string; planCode: string }) {
    async function handlePurchase() {
      'use server'
      await purchaseKouden({ koudensId, planCode })
      revalidatePath(`/koudens/${koudensId}`)
    }
    return <button onClick={handlePurchase}>購入する</button>
  }
  ```
- 閲覧制限時: ロックアイコンやグレースケール表示し、購入ボタンを表示
- 購入完了後: `revalidatePath('/koudens/[id]')` で再フェッチ

## 7. テスト  
- DDL実行テスト
- RLSポリシーテスト
- API統合テスト（購入前後、期限切れ時）
- E2E テスト（フロント購入フロー含む）
- Stripe決済異常系テスト（失敗、タイムアウト、Webhookシグニチャ検証失敗）
- RLSポリシー境界値テスト（14日ちょうど、メンバー/オーナー権限あり・なし）
- Cronリマインダー重複送信防止テスト

## 8. ドキュメント整備
- 本ドキュメント: `docs/developments/paid-implementation-plan.md`
- マーケティング資料: `docs/marketings/marketing-plan.md` にプラン概要を追記 

## 9. 新規作成時のプラン選択フロー

1. 香典帳情報入力フォーム
   - ユーザーがタイトル・説明を先に入力し、一時的にクライアント側（React state）に保持する
   - サーバーへのレコード作成はまだ行わない

2. プラン選択画面
   - Server Action `getPlans` で取得したプラン一覧を表示
   - ユーザーが選択したプランに応じて処理を分岐
     - **free** を選択:
       1. Server Action `createKouden` を呼び出し、`plan_id='free'` で `koudens` レコードを作成
       2. 作成完了後に香典帳一覧ページまたは詳細ページへリダイレクト
     - **basic / premium** を選択:
       1. Stripe Checkout セッションを生成し、`metadata` に入力フォームの香典帳情報と `planCode` を含める
       2. クライアントを Checkout 画面へ遷移
       3. Webhook で支払い完了を検知したら、Server Action `createKoudenWithPlan` を呼び出し、入力フォーム情報と選択プランで `koudens` レコードを作成
       4. `revalidatePath('/koudens/[id]')` を呼び出してキャッシュをクリアし、詳細ページへリダイレクト
     - **premium_full_support** を選択:
       1. プラン選択前に予想件数入力フォームを表示し、`expected_count` をユーザーから取得
       2. 価格を「base price + per_record_fee × expected_count」で計算
       3. Stripe Checkout セッションを生成し、`metadata` にフォーム情報、`planCode`、`expected_count` を含める
       4. クライアントを Checkout 画面へ遷移
       5. Webhook で支払い完了を検知後、Server Action `createKoudenWithPlan` で `koudens` レコードを作成し、`kouden_purchases.expected_count` に設定
       6. `revalidatePath('/koudens/[id]')` でキャッシュクリアし、詳細ページへリダイレクト
       7. 予想件数より実際の入力件数が少ない場合は返金不可として取り扱う

3. リダイレクト & キャッシュ再検証
   - 支払い完了後に `revalidatePath` を利用して該当パスを再フェッチ
   - 最新のプラン情報に基づいた閲覧制御が適用される

## 10. 既存香典帳のプラン変更フロー

### 10.1 無料期間中のアップグレード
- 香典帳一覧または詳細画面に「プランをアップグレード」ボタンを表示
- ボタンクリックでプラン選択モーダルをオープンし、`getPlans` で取得したプラン一覧を表示
- ユーザーが新プランを選択したら、以下を実行:
  1. 新プラン価格 - 現行プラン価格 で差額を計算
  2. Stripe Checkout セッションを生成し、`metadata` に `koudenId`, `currentPlanCode`, `newPlanCode` を含める
  3. クライアントを Checkout 画面へ遷移
- Webhook で支払い完了を検知後:
  1. Server Action `updateKoudenPlan` を呼び出し、`koudens.plan_id` を新プランの ID に更新
  2. `kouden_purchases` に購入履歴（差額）を追加
  3. `revalidatePath('/koudens/[id]')` でキャッシュクリアし、詳細ページを再フェッチ

### 10.2 無料期間終了後のアップグレード
- 「無料期間が終了しました」ページに「プランを購入」ボタンを表示
- ボタンをクリックした後の流れは 10.1 と同様に処理

### 10.3 有料プランからのアップグレード
- 現行プランのコード（`plan_id`）に応じて、アップグレード可能な上位プランのみをモーダルに表示
- 課金金額は「新プラン価格 - 現プラン価格」で自動計算
- 処理フローは 10.1 と同様 

### 10.4 アップグレード時の料金計算例
- Basic (2,980円) → Premium (7,980円) の場合: 差額 5,000円 を請求
- Premium (7,980円) → Premium+FullSupport (15,000円) の場合: 差額 7,020円 を請求
- ダウングレード（上位プランから下位プラン）への対応は基本的に行わない（返金処理の複雑さ回避のため） 

## 11. 領収書発行およびメール通知要件定義

### 11.1 領収書発行
- トリガ: Stripe Webhook `checkout.session.completed` の受信時
- 処理フロー:
  1. `kouden_purchases` テーブルから購入情報（purchaseId, user_id, plan_id, 金額, expected_countなど）を取得
  2. Handlebars や Mustache などのテンプレートにデータを埋め込み
  3. PDFKit または Puppeteer + Headless Chrome で PDF を生成
  4. Supabase Storage に `receipts/{purchaseId}.pdf` として保存
  5. Resend を用いてメール送信
     - 添付ファイルとして領収書PDFを base64 エンコードで添付
     - メール本文テンプレート: 購入完了のお礼と領収書案内
  6. `notifications` テーブルにレコードを挿入 (`notification_type = 'receipt'`)
- エラーハンドリング／冪等性:
  - Stripe Webhook シグニチャを検証し、正当性を担保
  - 同一 Webhook イベントの重複処理を防ぐためイベントIDを一意キーとして管理

### 11.2 リマインダー
- 送信タイミング:
  - 作成日 +12日目（閲覧期限2日前）
  - 作成日 +13日目（閲覧期限1日前）
  - 作成日 +14日目（閲覧期限当日）
- 実行方法:
  - Vercel Cron または Supabase Edge Function で毎日定期実行（例: 毎日0時に `/api/cron/send-reminders`）
- 処理フロー:
  1. 対象レコードを SQL で抽出
  2. Resend でメール送信（テンプレート例: "閲覧期限まであと2日です" 等）
  3. `notifications` テーブルにレコードを挿入 (`notification_type = 'reminder_before'` または `'reminder_after'`)

### 11.3 通知ログテーブル定義
ファイル: `database/notifications.sql`
```sql
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id TEXT UNIQUE NOT NULL, -- Stripe Webhook eventIDで一意管理
  kouden_id UUID NOT NULL REFERENCES koudens(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  notification_type TEXT NOT NULL
    CHECK (notification_type IN ('receipt','reminder_before','reminder_after')),
  sent_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  metadata JSONB       -- 任意の補足情報
);
```

### 11.4 環境変数
- RESEND_API_KEY       （Resend API キー）
- STRIPE_SECRET_KEY    （Stripe シークレットキー）
- STRIPE_WEBHOOK_SECRET（Stripe Webhook シグニチャ検証用シークレット）
- SUPABASE_URL        
- SUPABASE_SERVICE_ROLE_KEY （Supabase サービスロールキー）
- STRIPE_PUBLISHABLE_KEY （Stripe公開可能キー）

### 11.5 冪等性・エラーハンドリング
- Webhook: イベントID を監査テーブル or `notifications` に保存し重複チェック
- メール送信失敗時: リトライ or エラーログを出力し手動対応フローを設計 