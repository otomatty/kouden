-- Drop existing tables if they exist
DROP TABLE IF EXISTS return_items CASCADE;

-- Create return_items table (香典返しテーブル)
CREATE TABLE IF NOT EXISTS return_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    -- 関連する香典情報のID
    kouden_entry_id UUID NOT NULL REFERENCES kouden_entries(id) ON DELETE CASCADE,
    -- 品名
    name TEXT NOT NULL,
    -- 価格
    price INTEGER NOT NULL,
    -- 配送方法（配送/手渡し）
    delivery_method TEXT NOT NULL CHECK (delivery_method IN ('shipping', 'hand_delivery')),
    -- 送付日
    sent_date DATE,
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
DROP TRIGGER IF EXISTS update_return_items_updated_at ON return_items;

-- Create trigger for updated_at
CREATE TRIGGER update_return_items_updated_at
    BEFORE UPDATE ON return_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Drop existing indexes
DROP INDEX IF EXISTS idx_return_items_kouden_entry_id;

-- Create indexes
CREATE INDEX idx_return_items_kouden_entry_id ON return_items(kouden_entry_id);

-- Enable Row Level Security
ALTER TABLE return_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view return_items of their koudens" ON return_items;
DROP POLICY IF EXISTS "Users can insert return_items to their koudens" ON return_items;
DROP POLICY IF EXISTS "Users can update return_items of their koudens" ON return_items;
DROP POLICY IF EXISTS "Users can delete return_items of their koudens" ON return_items;

-- Create RLS policies
CREATE POLICY "Users can view return_items of their koudens"
    ON return_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM kouden_entries
            JOIN koudens ON koudens.id = kouden_entries.kouden_id
            WHERE kouden_entries.id = return_items.kouden_entry_id
            AND koudens.owner_id = auth.uid()::uuid
        )
    );

CREATE POLICY "Users can insert return_items to their koudens"
    ON return_items FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM kouden_entries
            JOIN koudens ON koudens.id = kouden_entries.kouden_id
            WHERE kouden_entries.id = kouden_entry_id
            AND koudens.owner_id = auth.uid()::uuid
        )
        AND auth.uid()::uuid = created_by
    );

CREATE POLICY "Users can update return_items of their koudens"
    ON return_items FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM kouden_entries
            JOIN koudens ON koudens.id = kouden_entries.kouden_id
            WHERE kouden_entries.id = return_items.kouden_entry_id
            AND koudens.owner_id = auth.uid()::uuid
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM kouden_entries
            JOIN koudens ON koudens.id = kouden_entries.kouden_id
            WHERE kouden_entries.id = return_items.kouden_entry_id
            AND koudens.owner_id = auth.uid()::uuid
        )
    );

CREATE POLICY "Users can delete return_items of their koudens"
    ON return_items FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM kouden_entries
            JOIN koudens ON koudens.id = kouden_entries.kouden_id
            WHERE kouden_entries.id = return_items.kouden_entry_id
            AND koudens.owner_id = auth.uid()::uuid
        )
    ); 