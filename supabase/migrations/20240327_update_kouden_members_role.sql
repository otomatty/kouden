-- kouden_membersテーブルのroleカラムの制約を更新
ALTER TABLE kouden_members
DROP CONSTRAINT IF EXISTS kouden_members_role_check;

ALTER TABLE kouden_members
ADD CONSTRAINT kouden_members_role_check
CHECK (role IN ('owner', 'editor', 'viewer')); 