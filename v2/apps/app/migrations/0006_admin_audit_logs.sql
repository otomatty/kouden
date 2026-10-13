-- 運営者操作の監査ログ（M5, E10）。docs/rebuild/03-domain-model.md §2
-- 運営者画面（apps/admin）の書き込みと同じ batch で記録する
CREATE TABLE admin_audit_logs (
  id                TEXT PRIMARY KEY,
  admin_email       TEXT NOT NULL,              -- Access JWT の email
  action            TEXT NOT NULL,
  target_type       TEXT NOT NULL,
  target_id         TEXT NOT NULL,
  detail            TEXT,                       -- JSON
  created_at        TEXT NOT NULL
);
CREATE INDEX idx_admin_audit_created ON admin_audit_logs(created_at);
