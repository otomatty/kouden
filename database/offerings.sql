-- Drop existing tables if they exist
DROP TABLE IF EXISTS offerings CASCADE;

-- Create offerings table (供物テーブル)
CREATE TABLE IF NOT EXISTS offerings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    -- 関連する香典情報のID
    kouden_entry_id UUID NOT NULL REFERENCES kouden_entries(id) ON DELETE CASCADE,
    -- 供物の種類（供花/供物/その他）
    type TEXT NOT NULL CHECK (type IN ('FLOWER', 'FOOD', 'OTHER')),
    -- 供物の内容
    description TEXT NOT NULL,
    -- 数量
    quantity INTEGER NOT NULL DEFAULT 1,
    -- 価格（任意）
    price INTEGER,
    -- 配送方法（配送/持参）
    delivery_method TEXT NOT NULL CHECK (delivery_method IN ('SHIPPING', 'HAND_DELIVERY')),
    -- 配送状況
    delivery_status TEXT NOT NULL CHECK (delivery_status IN ('PENDING', 'DELIVERED', 'CANCELED')) DEFAULT 'PENDING',
    -- 配送予定日時
    scheduled_delivery_at TIMESTAMP WITH TIME ZONE,
    -- 配送完了日時
    delivered_at TIMESTAMP WITH TIME ZONE,
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
DROP TRIGGER IF EXISTS update_offerings_updated_at ON offerings;

-- Create trigger for updated_at
CREATE TRIGGER update_offerings_updated_at
    BEFORE UPDATE ON offerings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Drop existing indexes
DROP INDEX IF EXISTS idx_offerings_kouden_entry_id;
DROP INDEX IF EXISTS idx_offerings_delivery_status;
DROP INDEX IF EXISTS idx_offerings_scheduled_delivery_at;

-- Create indexes
CREATE INDEX idx_offerings_kouden_entry_id ON offerings(kouden_entry_id);
CREATE INDEX idx_offerings_delivery_status ON offerings(delivery_status);
CREATE INDEX idx_offerings_scheduled_delivery_at ON offerings(scheduled_delivery_at);

-- Enable Row Level Security
ALTER TABLE offerings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view offerings of their koudens" ON offerings;
DROP POLICY IF EXISTS "Users can insert offerings to their koudens" ON offerings;
DROP POLICY IF EXISTS "Users can update offerings of their koudens" ON offerings;
DROP POLICY IF EXISTS "Users can delete offerings of their koudens" ON offerings;

-- Create RLS policies
CREATE POLICY "Users can view offerings of their koudens"
    ON offerings FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM kouden_entries
            JOIN koudens ON koudens.id = kouden_entries.kouden_id
            WHERE kouden_entries.id = offerings.kouden_entry_id
            AND koudens.owner_id = auth.uid()::uuid
        )
    );

CREATE POLICY "Users can insert offerings to their koudens"
    ON offerings FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM kouden_entries
            JOIN koudens ON koudens.id = kouden_entries.kouden_id
            WHERE kouden_entries.id = kouden_entry_id
            AND koudens.owner_id = auth.uid()::uuid
        )
        AND auth.uid()::uuid = created_by
    );

CREATE POLICY "Users can update offerings of their koudens"
    ON offerings FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM kouden_entries
            JOIN koudens ON koudens.id = kouden_entries.kouden_id
            WHERE kouden_entries.id = offerings.kouden_entry_id
            AND koudens.owner_id = auth.uid()::uuid
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM kouden_entries
            JOIN koudens ON koudens.id = kouden_entries.kouden_id
            WHERE kouden_entries.id = offerings.kouden_entry_id
            AND koudens.owner_id = auth.uid()::uuid
        )
    );

CREATE POLICY "Users can delete offerings of their koudens"
    ON offerings FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM kouden_entries
            JOIN koudens ON koudens.id = kouden_entries.kouden_id
            WHERE kouden_entries.id = offerings.kouden_entry_id
            AND koudens.owner_id = auth.uid()::uuid
        )
    ); 