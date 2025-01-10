-- kouden_membersのRLSポリシーを修正
DROP POLICY IF EXISTS "Users can view members of their koudens" ON kouden_members;
DROP POLICY IF EXISTS "Users can manage members of their koudens" ON kouden_members;

-- 新しいポリシーを作成
CREATE POLICY "Users can view members of their koudens"
    ON kouden_members FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM koudens
            WHERE koudens.id = kouden_members.kouden_id
            AND koudens.owner_id = auth.uid()::uuid
        )
    );

CREATE POLICY "Users can manage members if they are the owner"
    ON kouden_members FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM koudens
            WHERE koudens.id = kouden_members.kouden_id
            AND koudens.owner_id = auth.uid()::uuid
        )
    ); 