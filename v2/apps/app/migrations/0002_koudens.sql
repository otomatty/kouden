-- 香典帳の目録（中身は Durable Object KoudenLedger）。docs/rebuild/03-domain-model.md §2
CREATE TABLE koudens (
  id                TEXT PRIMARY KEY,           -- DO 名にも使う
  title             TEXT NOT NULL,
  deceased_name     TEXT NOT NULL,
  owner_user_id     TEXT NOT NULL REFERENCES users(id),
  plan              TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free','paid')),
  status            TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','archived','deleting')),
  legacy_kouden_id  TEXT UNIQUE,
  created_at        TEXT NOT NULL,
  updated_at        TEXT NOT NULL
);
CREATE INDEX idx_koudens_owner ON koudens(owner_user_id);
CREATE INDEX idx_koudens_deleting ON koudens(status) WHERE status = 'deleting';

-- メンバーシップ（オーナーも 1 行持つ）
CREATE TABLE kouden_members (
  kouden_id         TEXT NOT NULL REFERENCES koudens(id) ON DELETE CASCADE,
  user_id           TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role              TEXT NOT NULL CHECK (role IN ('owner','editor','viewer')),
  joined_at         TEXT NOT NULL,
  invited_by        TEXT REFERENCES users(id),
  PRIMARY KEY (kouden_id, user_id)
);
CREATE INDEX idx_members_user ON kouden_members(user_id);
-- 1 冊にオーナーは 1 人
CREATE UNIQUE INDEX uq_members_one_owner ON kouden_members(kouden_id) WHERE role = 'owner';

-- 統計用の要約（DO からの投影。表示専用）
CREATE TABLE kouden_stats (
  kouden_id         TEXT PRIMARY KEY REFERENCES koudens(id) ON DELETE CASCADE,
  gift_count        INTEGER NOT NULL,
  total_amount      INTEGER NOT NULL,           -- 香典（kind = 'koden'）の合計
  person_count      INTEGER NOT NULL,
  return_pending    INTEGER NOT NULL,
  last_activity_at  TEXT NOT NULL,
  projected_seq     INTEGER NOT NULL            -- どの change_log.seq 時点の要約か
);
