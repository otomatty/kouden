-- Drop existing tables if they exist
DROP TABLE IF EXISTS return_items CASCADE;

-- Create return_items table (香典返しテーブル)
CREATE TABLE IF NOT EXISTS return_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    -- 関連する香典情報のID
    kouden_entry_id UUID NOT NULL REFERENCES kouden_entries(id) ON DELETE CASCADE,
    -- 品名
    name TEXT NOT NULL,
    -- 数量
    quantity INTEGER NOT NULL DEFAULT 1,
    -- 価格
    price INTEGER NOT NULL,
    -- 配送方法（配送/手渡し）
    delivery_method TEXT NOT NULL CHECK (delivery_method IN ('SHIPPING', 'HAND_DELIVERY')),
    -- 配送状況
    delivery_status TEXT NOT NULL CHECK (delivery_status IN ('PENDING', 'DELIVERED', 'CANCELED')) DEFAULT 'PENDING',
    -- 配送予定日時
    scheduled_delivery_at TIMESTAMP WITH TIME ZONE,
    -- 配送完了日時
    delivered_at TIMESTAMP WITH TIME ZONE,
    -- 配送先の緯度
    latitude DOUBLE PRECISION,
    -- 配送先の経度
    longitude DOUBLE PRECISION,
    -- 配送エリアID
    delivery_area_id TEXT,
    -- 配送ルートの順序（同じエリア内での配送順序）
    delivery_order INTEGER,
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
DROP INDEX IF EXISTS idx_return_items_delivery_status;
DROP INDEX IF EXISTS idx_return_items_scheduled_delivery_at;
DROP INDEX IF EXISTS idx_return_items_delivery_area;
DROP INDEX IF EXISTS idx_return_items_location;

-- Create indexes
CREATE INDEX idx_return_items_kouden_entry_id ON return_items(kouden_entry_id);
CREATE INDEX idx_return_items_delivery_status ON return_items(delivery_status);
CREATE INDEX idx_return_items_scheduled_delivery_at ON return_items(scheduled_delivery_at);
CREATE INDEX idx_return_items_delivery_area ON return_items(delivery_area_id);
CREATE INDEX idx_return_items_location ON return_items USING gist (
    ll_to_earth(latitude, longitude)
) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

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