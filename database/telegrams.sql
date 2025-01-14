-- Drop existing tables if they exist
DROP TABLE IF EXISTS telegrams CASCADE;

-- Create telegrams table (弔電テーブル)
CREATE TABLE IF NOT EXISTS telegrams (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    -- 関連する香典情報のID
    kouden_entry_id UUID NOT NULL REFERENCES kouden_entries(id) ON DELETE CASCADE,
    -- 差出人名
    sender_name TEXT NOT NULL,
    -- 差出人の組織名
    sender_organization TEXT,
    -- 差出人の役職
    sender_position TEXT,
    -- メッセージ内容
    message TEXT NOT NULL,
    -- 料金区分
    price_category TEXT NOT NULL CHECK (price_category IN ('STANDARD', 'PREMIUM', 'DELUXE')),
    -- 料金
    price INTEGER NOT NULL,
    -- 受付日時
    received_at TIMESTAMP WITH TIME ZONE NOT NULL,
    -- 配達予定日時
    scheduled_delivery_at TIMESTAMP WITH TIME ZONE NOT NULL,
    -- 配達状況
    delivery_status TEXT NOT NULL CHECK (delivery_status IN ('PENDING', 'DELIVERED', 'CANCELED')) DEFAULT 'PENDING',
    -- 配達完了日時
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
DROP TRIGGER IF EXISTS update_telegrams_updated_at ON telegrams;

-- Create trigger for updated_at
CREATE TRIGGER update_telegrams_updated_at
    BEFORE UPDATE ON telegrams
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Drop existing indexes
DROP INDEX IF EXISTS idx_telegrams_kouden_entry_id;
DROP INDEX IF EXISTS idx_telegrams_delivery_status;
DROP INDEX IF EXISTS idx_telegrams_scheduled_delivery_at;
DROP INDEX IF EXISTS idx_telegrams_received_at;

-- Create indexes
CREATE INDEX idx_telegrams_kouden_entry_id ON telegrams(kouden_entry_id);
CREATE INDEX idx_telegrams_delivery_status ON telegrams(delivery_status);
CREATE INDEX idx_telegrams_scheduled_delivery_at ON telegrams(scheduled_delivery_at);
CREATE INDEX idx_telegrams_received_at ON telegrams(received_at);

-- Enable Row Level Security
ALTER TABLE telegrams ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view telegrams of their koudens"
    ON telegrams FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM kouden_entries
            JOIN koudens ON koudens.id = kouden_entries.kouden_id
            WHERE kouden_entries.id = telegrams.kouden_entry_id
            AND koudens.owner_id = auth.uid()::uuid
        )
    );

CREATE POLICY "Users can insert telegrams to their koudens"
    ON telegrams FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM kouden_entries
            JOIN koudens ON koudens.id = kouden_entries.kouden_id
            WHERE kouden_entries.id = kouden_entry_id
            AND koudens.owner_id = auth.uid()::uuid
        )
        AND auth.uid()::uuid = created_by
    );

CREATE POLICY "Users can update telegrams of their koudens"
    ON telegrams FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM kouden_entries
            JOIN koudens ON koudens.id = kouden_entries.kouden_id
            WHERE kouden_entries.id = telegrams.kouden_entry_id
            AND koudens.owner_id = auth.uid()::uuid
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM kouden_entries
            JOIN koudens ON koudens.id = kouden_entries.kouden_id
            WHERE kouden_entries.id = telegrams.kouden_entry_id
            AND koudens.owner_id = auth.uid()::uuid
        )
    );

CREATE POLICY "Users can delete telegrams of their koudens"
    ON telegrams FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM kouden_entries
            JOIN koudens ON koudens.id = kouden_entries.kouden_id
            WHERE kouden_entries.id = telegrams.kouden_entry_id
            AND koudens.owner_id = auth.uid()::uuid
        )
    ); 