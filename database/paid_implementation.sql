-- 有料化機能実装用 データベース更新クエリまとめ

-- 1. plansテーブル作成
CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);
CREATE INDEX IF NOT EXISTS idx_plans_code ON plans(code);

-- 2. kouden_purchasesテーブル作成
CREATE TABLE IF NOT EXISTS kouden_purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kouden_id UUID NOT NULL REFERENCES koudens(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  plan_id UUID NOT NULL REFERENCES plans(id),
  expected_count INTEGER,
  amount_paid INTEGER NOT NULL,
  stripe_session_id TEXT,
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT uq_kouden_user_plan UNIQUE (kouden_id, user_id, plan_id)
);
CREATE INDEX IF NOT EXISTS idx_kouden_purchases_kouden ON kouden_purchases(kouden_id);
CREATE INDEX IF NOT EXISTS idx_kouden_purchases_user ON kouden_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_kouden_purchases_plan ON kouden_purchases(plan_id);

-- 3. notificationsテーブル作成
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
CREATE INDEX IF NOT EXISTS idx_notifications_kouden ON notifications(kouden_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);

-- Plans 初期データシード（バックフィル前に実行）
INSERT INTO plans (code, name, description, price) VALUES
  ('free', '無料プラン', '作成から14日間無料で閲覧可能', 0),
  ('basic', 'ベーシックプラン', '基本機能制限解除', 2980),
  ('premium', 'プレミアムプラン', '無制限閲覧', 7980),
  ('premium_full_support', 'プレミアム＋フルサポートプラン', '無制限閲覧およびサポート', 15000)
ON CONFLICT (code) DO NOTHING;

-- 4. koudensテーブルに plan_id 追加・バックフィル・NOT NULL設定・インデックス作成
ALTER TABLE koudens
  ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES plans(id);
UPDATE koudens
  SET plan_id = (SELECT id FROM plans WHERE code = 'free')
  WHERE plan_id IS NULL;
ALTER TABLE koudens
  ALTER COLUMN plan_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_koudens_plan ON koudens(plan_id);

-- 5. RLSポリシー更新例 (Supabase 管理画面で既存ポリシーに統合)
DROP POLICY IF EXISTS "Allow select on koudens" ON koudens;
CREATE POLICY "Allow select on koudens" ON koudens
  FOR SELECT
  USING (
    (created_at + INTERVAL '14 days' > NOW())
    OR plan_id <> (SELECT id FROM plans WHERE code = 'free')
    OR EXISTS (
      SELECT 1 FROM kouden_members km
      WHERE km.kouden_id = koudens.id AND km.user_id = auth.uid()
    )
    OR owner_id = auth.uid()
  );

-- 6. plansテーブルにRLSポリシーを設定
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_select_plans" ON plans
  FOR SELECT
  USING (true);
CREATE POLICY "service_role_manage_plans" ON plans
  FOR ALL
  USING (auth.role() = 'service_role');

-- 7. kouden_purchasesテーブルにRLSポリシーを設定
ALTER TABLE kouden_purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_own_purchases" ON kouden_purchases
  FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "insert_own_purchase" ON kouden_purchases
  FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "service_role_update_purchases" ON kouden_purchases
  FOR UPDATE
  USING (auth.role() = 'service_role');

CREATE POLICY "service_role_delete_purchases" ON kouden_purchases
  FOR DELETE
  USING (auth.role() = 'service_role');

-- 8. notificationsテーブルにRLSポリシーを設定
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_own_notifications" ON notifications
  FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "service_role_insert_notifications" ON notifications
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "service_role_update_notifications" ON notifications
  FOR UPDATE
  USING (auth.role() = 'service_role');

CREATE POLICY "service_role_delete_notifications" ON notifications
  FOR DELETE
  USING (auth.role() = 'service_role');

-- notification_typesテーブルにRLSポリシーを設定
ALTER TABLE public.notification_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_notification_types_for_authenticated" ON public.notification_types
  FOR SELECT
  USING (auth.role() = 'authenticated');
CREATE POLICY "service_role_manage_notification_types" ON public.notification_types
  FOR ALL
  USING (auth.role() = 'service_role');

-- 9. plansテーブル 初期データシード
INSERT INTO plans (code, name, description, price) VALUES
  ('free', '無料プラン', '作成から14日間無料で閲覧可能', 0),
  ('basic', 'ベーシックプラン', '基本機能制限解除', 2980),
  ('premium', 'プレミアムプラン', '無制限閲覧', 7980),
  ('premium_full_support', 'プレミアム＋フルサポートプラン', '無制限閲覧およびサポート', 15000)
ON CONFLICT (code) DO NOTHING;

-- 10. コメント設定
COMMENT ON TABLE plans IS '課金プランを管理するテーブル';
COMMENT ON COLUMN plans.id IS 'プランの一意識別子（UUID)';
COMMENT ON COLUMN plans.code IS 'プラン識別用コード（例: free, basic, premium, premium_full_support)';
COMMENT ON COLUMN plans.name IS 'プラン表示名';
COMMENT ON COLUMN plans.description IS 'プラン説明文';
COMMENT ON COLUMN plans.price IS 'プランの基本価格（円）';
COMMENT ON COLUMN plans.created_at IS 'レコード作成日時（UTC)';
COMMENT ON COLUMN plans.updated_at IS 'レコード更新日時（UTC)';

COMMENT ON TABLE kouden_purchases IS '香典帳のプラン購入履歴テーブル';
COMMENT ON COLUMN kouden_purchases.id IS '購入履歴の一意識別子（UUID)';
COMMENT ON COLUMN kouden_purchases.kouden_id IS '対象の香典帳ID';
COMMENT ON COLUMN kouden_purchases.user_id IS '購入ユーザーのID';
COMMENT ON COLUMN kouden_purchases.plan_id IS '購入プランのID';
COMMENT ON COLUMN kouden_purchases.expected_count IS '（premium_full_support用）予想入力件数';
COMMENT ON COLUMN kouden_purchases.amount_paid IS '実際に請求した合計金額（円）';
COMMENT ON COLUMN kouden_purchases.stripe_session_id IS 'Stripe Checkout セッションID';
COMMENT ON COLUMN kouden_purchases.purchased_at IS '購入日時（UTC)';

COMMENT ON TABLE notifications IS '各種通知ログを管理するテーブル';
COMMENT ON COLUMN notifications.id IS '通知ログの一意識別子（UUID)';
COMMENT ON COLUMN notifications.event_id IS 'Stripe Webhook イベントID';
COMMENT ON COLUMN notifications.kouden_id IS '対象の香典帳ID';
COMMENT ON COLUMN notifications.user_id IS '通知受信ユーザーID';
COMMENT ON COLUMN notifications.notification_type IS '通知種別（receipt, reminder_before, reminder_after)';
COMMENT ON COLUMN notifications.sent_at IS '通知送信日時（UTC)';
COMMENT ON COLUMN notifications.metadata IS '通知付随情報（JSONB)';

COMMENT ON COLUMN koudens.plan_id IS '香典帳に紐づくプランID'; 

-- 1) pg_cron 拡張を有効化（初回のみ）
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2) 毎日 0:00 に無料プラン期限切れの香典帳を archived に更新
SELECT cron.schedule(
  'archive_free_koudens_daily',       -- ジョブ名
  '0 0 * * *',                         -- cron 式（毎日深夜0時）
  $$
    UPDATE public.koudens
    SET status = 'archived'
    WHERE status = 'active'
      AND plan_id = (SELECT id FROM plans WHERE code = 'free')
      AND created_at < now() - INTERVAL '14 days';
  $$
);