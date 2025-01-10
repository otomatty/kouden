-- Drop existing tables if they exist
DROP TABLE IF EXISTS relationships CASCADE;

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS set_updated_at CASCADE;

-- Create trigger function for updating updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create relationships table (故人との関係性テーブル)
CREATE TABLE IF NOT EXISTS relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kouden_id UUID NOT NULL REFERENCES koudens(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    -- 関係性の説明（任意）
    description TEXT,
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    UNIQUE (kouden_id, name)
);

-- 更新日時を自動更新するトリガー
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON relationships
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- RLSポリシー
ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;

-- 閲覧ポリシー
CREATE POLICY "ユーザーは自分が作成した香典帳の関係性を閲覧できる" ON relationships
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM koudens
            WHERE koudens.id = relationships.kouden_id
            AND koudens.created_by = auth.uid()
        )
    );

-- 作成ポリシー
CREATE POLICY "ユーザーは自分が作成した香典帳に関係性を追加できる" ON relationships
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM koudens
            WHERE koudens.id = relationships.kouden_id
            AND koudens.created_by = auth.uid()
        )
    );

-- 更新ポリシー
CREATE POLICY "ユーザーは自分が作成した関係性を更新できる" ON relationships
    FOR UPDATE USING (
        created_by = auth.uid()
        AND NOT is_default
    );

-- 削除ポリシー
CREATE POLICY "ユーザーは自分が作成した関係性を削除できる" ON relationships
    FOR DELETE USING (
        created_by = auth.uid()
        AND NOT is_default
    ); 