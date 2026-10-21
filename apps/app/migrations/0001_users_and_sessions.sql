-- ユーザー。Google の sub で一意に識別する
CREATE TABLE users (
  id                TEXT PRIMARY KEY,
  google_sub        TEXT UNIQUE,                -- 移行直後のメールログインユーザーは NULL（初回ログインで埋まる）
  email             TEXT NOT NULL,
  display_name      TEXT NOT NULL,
  avatar_url        TEXT,                       -- Google のプロフィール画像 URL（自前保存しない）
  legacy_user_id    TEXT UNIQUE,                -- 旧 Supabase auth.users.id
  created_at        TEXT NOT NULL,
  updated_at        TEXT NOT NULL,
  deleted_at        TEXT
);
CREATE INDEX idx_users_email ON users(email);

-- セッション。Cookie には生トークン、ここには SHA-256 ハッシュのみ
CREATE TABLE sessions (
  token_hash        TEXT PRIMARY KEY,
  user_id           TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at        TEXT NOT NULL,
  expires_at        TEXT NOT NULL,
  last_seen_at      TEXT NOT NULL,
  user_agent        TEXT
);
CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);

-- 旧ユーザー（自動で紐づかなかった人の手動紐づけ用）
CREATE TABLE legacy_users (
  legacy_user_id    TEXT PRIMARY KEY,
  email             TEXT NOT NULL,
  display_name      TEXT,
  auth_provider     TEXT NOT NULL CHECK (auth_provider IN ('google','email')),
  linked_user_id    TEXT REFERENCES users(id),
  linked_at         TEXT,
  linked_by         TEXT                        -- 'auto' | 運営者のメールアドレス
);
CREATE INDEX idx_legacy_users_email ON legacy_users(email);
