-- 既存のnameカラムのNOT NULL制約を削除
ALTER TABLE kouden_entries
    ALTER COLUMN name DROP NOT NULL;

-- コメントを更新
COMMENT ON COLUMN kouden_entries.name IS 'ご芳名(任意)';

-- 変更をログに記録
INSERT INTO schema_migrations (version, applied_at)
VALUES ('20240120_make_name_nullable', CURRENT_TIMESTAMP); 