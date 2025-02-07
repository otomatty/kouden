-- Drop existing policy
DROP POLICY IF EXISTS kouden_members_access ON kouden_members;

-- Create new policy for kouden_members
CREATE POLICY kouden_members_access ON kouden_members
    FOR ALL
    TO authenticated
    USING (
        -- 香典帳のオーナーまたは自身のレコードのみアクセス可能
        EXISTS (
            SELECT 1 FROM koudens k
            WHERE k.id = kouden_members.kouden_id
            AND k.owner_id = auth.uid()
        )
        OR user_id = auth.uid()
    )
    WITH CHECK (
        -- 香典帳のオーナーまたは自身のレコードのみ更新可能
        EXISTS (
            SELECT 1 FROM koudens k
            WHERE k.id = kouden_members.kouden_id
            AND k.owner_id = auth.uid()
        )
        OR user_id = auth.uid()
    );

-- コメント
COMMENT ON POLICY kouden_members_access ON kouden_members IS 
'香典帳のメンバーに対する基本的なアクセス制御:
- 香典帳のオーナーは全てのメンバーレコードにアクセス可能
- ユーザーは自分自身のメンバーレコードにアクセス可能
詳細な権限チェックはServer Actionsで実施'; 