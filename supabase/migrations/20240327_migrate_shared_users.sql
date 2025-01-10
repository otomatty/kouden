-- 既存の共有ユーザーを kouden_members テーブルに移行
INSERT INTO kouden_members (kouden_id, user_id, role, created_by)
SELECT 
    k.id as kouden_id,
    unnest(k.shared_user_ids) as user_id,
    'viewer' as role,
    k.owner_id as created_by
FROM koudens k
WHERE array_length(k.shared_user_ids, 1) > 0;

-- shared_user_ids カラムを削除
ALTER TABLE koudens DROP COLUMN shared_user_ids; 