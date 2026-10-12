-- 招待リンクとオーナー譲渡（M2）。docs/rebuild/03-domain-model.md §2

-- 招待リンク（URL にはトークン本体、ここにはハッシュ）
CREATE TABLE invitations (
  id                TEXT PRIMARY KEY,
  kouden_id         TEXT NOT NULL REFERENCES koudens(id) ON DELETE CASCADE,
  token_hash        TEXT NOT NULL UNIQUE,
  role              TEXT NOT NULL CHECK (role IN ('editor','viewer')),
  max_uses          INTEGER,                    -- NULL = 無制限
  used_count        INTEGER NOT NULL DEFAULT 0,
  expires_at        TEXT NOT NULL,
  created_by        TEXT NOT NULL REFERENCES users(id),
  created_at        TEXT NOT NULL,
  revoked_at        TEXT
);
CREATE INDEX idx_invitations_kouden ON invitations(kouden_id);

-- オーナー譲渡
CREATE TABLE ownership_transfers (
  id                TEXT PRIMARY KEY,
  kouden_id         TEXT NOT NULL REFERENCES koudens(id) ON DELETE CASCADE,
  from_user_id      TEXT NOT NULL REFERENCES users(id),
  to_user_id        TEXT NOT NULL REFERENCES users(id),
  status            TEXT NOT NULL CHECK (status IN ('pending','accepted','declined','cancelled','expired')),
  created_at        TEXT NOT NULL,
  expires_at        TEXT NOT NULL,              -- 7 日
  resolved_at       TEXT
);
-- 1 冊に保留中の譲渡は 1 件
CREATE UNIQUE INDEX uq_transfers_pending ON ownership_transfers(kouden_id) WHERE status = 'pending';
CREATE INDEX idx_transfers_to ON ownership_transfers(to_user_id) WHERE status = 'pending';
