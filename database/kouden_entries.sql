-- Drop existing tables if they exist
DROP TABLE IF EXISTS kouden_entries CASCADE;

-- Create kouden_entries table (香典情報テーブル)
CREATE TABLE IF NOT EXISTS kouden_entries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    -- 所属する香典帳のID
    kouden_id UUID NOT NULL REFERENCES koudens(id) ON DELETE CASCADE,
    
    -- 基本情報
    -- ご芳名(任意)
    name TEXT,
    -- 団体名（任意）
    organization TEXT,
    -- 役職（任意）
    position TEXT,
    -- 香典の金額（円）
    amount INTEGER NOT NULL DEFAULT 0,
    -- 住所(任意)
    postal_code TEXT,
    address TEXT,
    -- 電話番号（任意）
    phone_number TEXT,
    -- 故人との関係性
    relationship_id UUID REFERENCES relationships(id),
    
    -- 参列情報
    -- 参列タイプ（葬儀/弔問/欠席）
    attendance_type TEXT NOT NULL DEFAULT 'FUNERAL',
    
    -- 供物の有無
    has_offering BOOLEAN NOT NULL DEFAULT FALSE,
    -- 香典返し済みかどうか
    is_return_completed BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- その他
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
DROP TRIGGER IF EXISTS update_kouden_entries_updated_at ON kouden_entries;

-- Create trigger for updated_at
CREATE TRIGGER update_kouden_entries_updated_at
    BEFORE UPDATE ON kouden_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Drop existing indexes
DROP INDEX IF EXISTS idx_kouden_entries_kouden_id;
DROP INDEX IF EXISTS idx_kouden_entries_created_by;
DROP INDEX IF EXISTS idx_kouden_entries_relationship_id;

-- Create indexes
CREATE INDEX idx_kouden_entries_kouden_id ON kouden_entries(kouden_id);
CREATE INDEX idx_kouden_entries_created_by ON kouden_entries(created_by);
CREATE INDEX idx_kouden_entries_relationship_id ON kouden_entries(relationship_id);

-- Enable Row Level Security
ALTER TABLE kouden_entries ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view entries of their koudens" ON kouden_entries;
DROP POLICY IF EXISTS "Users can insert entries to their koudens" ON kouden_entries;
DROP POLICY IF EXISTS "Users can update entries of their koudens" ON kouden_entries;
DROP POLICY IF EXISTS "Users can delete entries of their koudens" ON kouden_entries;

-- Create RLS policies for kouden_entries
CREATE POLICY "Users can view entries of their koudens"
    ON kouden_entries FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM koudens
            WHERE koudens.id = kouden_entries.kouden_id
            AND koudens.owner_id = auth.uid()::uuid
        )
    );

CREATE POLICY "Users can insert entries to their koudens"
    ON kouden_entries FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM koudens
            WHERE koudens.id = kouden_id
            AND koudens.owner_id = auth.uid()::uuid
        )
        AND auth.uid()::uuid = created_by
    );

CREATE POLICY "Users can update entries of their koudens"
    ON kouden_entries FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM koudens
            WHERE koudens.id = kouden_entries.kouden_id
            AND koudens.owner_id = auth.uid()::uuid
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM koudens
            WHERE koudens.id = kouden_entries.kouden_id
            AND koudens.owner_id = auth.uid()::uuid
        )
    );

CREATE POLICY "Users can delete entries of their koudens"
    ON kouden_entries FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM koudens
            WHERE koudens.id = kouden_entries.kouden_id
            AND koudens.owner_id = auth.uid()::uuid
        )
    ); 