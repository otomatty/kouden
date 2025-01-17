-- 依存するポリシーを削除
DROP POLICY IF EXISTS invitee_access ON kouden_invitations;
DROP POLICY IF EXISTS "Allow users to read inviter info" ON auth.users;
DROP POLICY IF EXISTS "Allow users to read invitations" ON kouden_invitations;

-- emailカラムを削除
ALTER TABLE kouden_invitations
DROP COLUMN IF EXISTS email CASCADE;

-- emailに関連する古いインデックスを削除
DROP INDEX IF EXISTS idx_pending_invitations;

-- 新しいポリシーを作成（email関連の条件を除外）
CREATE POLICY "Allow users to read invitations"
    ON kouden_invitations
    FOR SELECT
    TO authenticated
    USING (
        created_by = auth.uid()
        OR
        EXISTS (
            SELECT 1 FROM koudens k
            WHERE k.id = kouden_invitations.kouden_id
            AND k.owner_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 
            FROM kouden_members m
            JOIN kouden_roles r ON r.id = m.role_id
            WHERE m.kouden_id = kouden_invitations.kouden_id
            AND m.user_id = auth.uid()
            AND r.name = '編集者'
        )
    ); 