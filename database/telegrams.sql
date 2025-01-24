-- Drop existing tables if they exist
DROP TABLE IF EXISTS telegrams CASCADE;

-- Create telegrams table (弔電テーブル)
CREATE TABLE IF NOT EXISTS telegrams (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    -- 関連する香典のID
    kouden_id UUID REFERENCES koudens(id) ON DELETE CASCADE NOT NULL,
    -- 関連する香典情報のID（任意）
    kouden_entry_id UUID REFERENCES kouden_entries(id) ON DELETE CASCADE,
    -- 差出人名
    sender_name TEXT NOT NULL,
    -- 差出人の組織名
    sender_organization TEXT,
    -- 差出人の役職
    sender_position TEXT,
    -- メッセージ内容
    message TEXT,
    -- 備考
    notes TEXT,
    -- 作成日時
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    -- 更新日時
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    -- 作成者のユーザーID（authテーブルの参照）
    created_by UUID NOT NULL REFERENCES auth.users(id)
);

-- Drop existing triggers
DROP TRIGGER IF EXISTS update_telegrams_updated_at ON telegrams;

-- Create trigger for updated_at
CREATE TRIGGER update_telegrams_updated_at
    BEFORE UPDATE ON telegrams
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create indexes
CREATE INDEX idx_telegrams_kouden_id ON telegrams(kouden_id);
CREATE INDEX idx_telegrams_kouden_entry_id ON telegrams(kouden_entry_id);
CREATE INDEX idx_telegrams_created_by ON telegrams(created_by);

-- Enable Row Level Security
ALTER TABLE telegrams ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own telegrams or telegrams they have access to"
    ON telegrams FOR SELECT
    TO authenticated
    USING (
        created_by = auth.uid()
        OR EXISTS (
            SELECT 1
            FROM kouden_members
            WHERE kouden_members.kouden_id = telegrams.kouden_id
            AND kouden_members.user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1
            FROM koudens
            WHERE koudens.id = telegrams.kouden_id
            AND (koudens.owner_id = auth.uid() OR koudens.created_by = auth.uid())
        )
    );

CREATE POLICY "Users can insert telegrams if they have edit access"
    ON telegrams FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM kouden_members m
            JOIN kouden_roles r ON m.role_id = r.id
            WHERE m.kouden_id = telegrams.kouden_id
            AND m.user_id = auth.uid()
            AND r.name = '編集者'
        )
        OR EXISTS (
            SELECT 1
            FROM koudens
            WHERE koudens.id = telegrams.kouden_id
            AND (koudens.owner_id = auth.uid() OR koudens.created_by = auth.uid())
        )
    );

CREATE POLICY "Users can update telegrams if they have edit access"
    ON telegrams FOR UPDATE
    TO authenticated
    USING (
        created_by = auth.uid()
        OR EXISTS (
            SELECT 1
            FROM kouden_members m
            JOIN kouden_roles r ON m.role_id = r.id
            WHERE m.kouden_id = telegrams.kouden_id
            AND m.user_id = auth.uid()
            AND r.name = '編集者'
        )
        OR EXISTS (
            SELECT 1
            FROM koudens
            WHERE koudens.id = telegrams.kouden_id
            AND (koudens.owner_id = auth.uid() OR koudens.created_by = auth.uid())
        )
    );

CREATE POLICY "Users can delete telegrams if they have edit access"
    ON telegrams FOR DELETE
    TO authenticated
    USING (
        created_by = auth.uid()
        OR EXISTS (
            SELECT 1
            FROM kouden_members m
            JOIN kouden_roles r ON m.role_id = r.id
            WHERE m.kouden_id = telegrams.kouden_id
            AND m.user_id = auth.uid()
            AND r.name = '編集者'
        )
        OR EXISTS (
            SELECT 1
            FROM koudens
            WHERE koudens.id = telegrams.kouden_id
            AND (koudens.owner_id = auth.uid() OR koudens.created_by = auth.uid())
        )
    ); 