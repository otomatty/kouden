-- koudensテーブルのRLSポリシーを修正
DROP POLICY IF EXISTS "Users can view their own koudens" ON koudens;
DROP POLICY IF EXISTS "Users can insert their own koudens" ON koudens;
DROP POLICY IF EXISTS "Users can update their own koudens" ON koudens;
DROP POLICY IF EXISTS "Users can delete their own koudens" ON koudens;

-- 新しいポリシーを作成
CREATE POLICY "Users can view their own koudens"
    ON koudens FOR SELECT
    USING (
        auth.uid()::uuid = owner_id
    );

CREATE POLICY "Users can insert their own koudens"
    ON koudens FOR INSERT
    WITH CHECK (
        auth.uid()::uuid = owner_id
        AND auth.uid()::uuid = created_by
    );

CREATE POLICY "Users can update their own koudens"
    ON koudens FOR UPDATE
    USING (auth.uid()::uuid = owner_id)
    WITH CHECK (auth.uid()::uuid = owner_id);

CREATE POLICY "Users can delete their own koudens"
    ON koudens FOR DELETE
    USING (auth.uid()::uuid = owner_id); 