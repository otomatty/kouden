-- 購入と Stripe Webhook の冪等化（M4, E9）。docs/rebuild/03-domain-model.md §2

-- 購入。会計の記録なので、香典帳・ユーザーを削除しても残す（外部キーにしない）
CREATE TABLE purchases (
  id                         TEXT PRIMARY KEY,
  kouden_id                  TEXT NOT NULL,
  user_id                    TEXT NOT NULL,
  amount                     INTEGER NOT NULL,
  currency                   TEXT NOT NULL DEFAULT 'jpy',
  stripe_checkout_session_id TEXT UNIQUE,       -- 移行分・手動付与は NULL
  stripe_payment_intent_id   TEXT UNIQUE,       -- 返金（charge.refunded）から購入を探す
  source                     TEXT NOT NULL CHECK (source IN ('stripe','legacy','admin')),
  status                     TEXT NOT NULL CHECK (status IN ('paid','refunded')),
  created_at                 TEXT NOT NULL,
  refunded_at                TEXT
);
CREATE INDEX idx_purchases_kouden ON purchases(kouden_id);

-- Stripe Webhook の冪等化（同じイベントを二度処理しない）
CREATE TABLE stripe_events (
  event_id          TEXT PRIMARY KEY,
  type              TEXT NOT NULL,
  processed_at      TEXT NOT NULL
);

-- 全額返金された支払い。Stripe のイベントは順番どおりに届くとは限らず、購入の確定より先に返金が届くことがある。
-- 購入の確定時にここを見て、返金済みの支払いを有効な購入にしない
CREATE TABLE stripe_refunds (
  payment_intent_id TEXT PRIMARY KEY,
  refunded_at       TEXT NOT NULL
);
