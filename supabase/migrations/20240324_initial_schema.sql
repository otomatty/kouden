-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (with CASCADE)
DROP TABLE IF EXISTS return_items CASCADE;
DROP TABLE IF EXISTS offerings CASCADE;
DROP TABLE IF EXISTS kouden_entries CASCADE;
DROP TABLE IF EXISTS kouden_members CASCADE;
DROP TABLE IF EXISTS kouden_invitations CASCADE;
DROP TABLE IF EXISTS koudens CASCADE;

-- Create koudens table (香典帳テーブル)
CREATE TABLE IF NOT EXISTS koudens (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    -- 香典帳のタイトル（例：「〇〇家 告別式」）
    title TEXT NOT NULL,
    -- 香典帳の説明（任意）
    description TEXT,
    -- 作成日時
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    -- 更新日時
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    -- 作成者のユーザーID（authテーブルの参照）
    created_by UUID NOT NULL REFERENCES auth.users(id),
    -- 所有者のユーザーID（authテーブルの参照）
    owner_id UUID NOT NULL REFERENCES auth.users(id),
    -- 共有ユーザーのID配列（authテーブルの参照）
    shared_user_ids UUID[] DEFAULT '{}'::UUID[] NOT NULL,
    -- 香典帳の状態（active/archived）
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived'))
);

-- Create kouden_entries table (香典情報テーブル)
CREATE TABLE IF NOT EXISTS kouden_entries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    -- 所属する香典帳のID
    kouden_id UUID NOT NULL REFERENCES koudens(id) ON DELETE CASCADE,
    
    -- 基本情報
    -- 姓
    last_name TEXT NOT NULL,
    -- 名
    first_name TEXT NOT NULL,
    -- 団体名（任意）
    organization TEXT,
    -- 役職（任意）
    position TEXT,
    -- 香典の金額（円）
    amount INTEGER NOT NULL,
    -- 住所
    postal_code TEXT,
    address TEXT NOT NULL,
    -- 電話番号（任意）
    phone_number TEXT,
    
    -- 参列情報
    -- 参列タイプ（葬儀/弔問/欠席）
    attendance_type TEXT NOT NULL CHECK (attendance_type IN ('FUNERAL', 'CONDOLENCE_VISIT', 'ABSENT')),
    -- 弔電の有無
    has_telegram BOOLEAN DEFAULT FALSE NOT NULL,
    
    -- お供え物の有無
    has_offering BOOLEAN DEFAULT FALSE NOT NULL,
    -- 香典返し済みかどうか
    is_return_completed BOOLEAN DEFAULT FALSE NOT NULL,
    
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

-- Create offerings table (お供え物テーブル)
CREATE TABLE IF NOT EXISTS offerings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    -- 関連する香典情報のID
    kouden_entry_id UUID NOT NULL REFERENCES kouden_entries(id) ON DELETE CASCADE,
    -- お供え物の種類（供花/供物/その他）
    type TEXT NOT NULL CHECK (type IN ('FLOWER', 'FOOD', 'OTHER')),
    -- お供え物の内容
    description TEXT NOT NULL,
    -- 価格（任意）
    price INTEGER,
    -- 備考
    notes TEXT,
    -- 作成日時
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    -- 更新日時
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    -- 作成者のユーザーID（authテーブルの参照）
    created_by UUID NOT NULL REFERENCES auth.users(id)
);

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

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_koudens_updated_at ON koudens;
DROP TRIGGER IF EXISTS update_kouden_entries_updated_at ON kouden_entries;
DROP TRIGGER IF EXISTS update_offerings_updated_at ON offerings;
DROP TRIGGER IF EXISTS update_return_items_updated_at ON return_items;

-- Create triggers for updated_at
CREATE TRIGGER update_koudens_updated_at
    BEFORE UPDATE ON koudens
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kouden_entries_updated_at
    BEFORE UPDATE ON kouden_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_offerings_updated_at
    BEFORE UPDATE ON offerings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_return_items_updated_at
    BEFORE UPDATE ON return_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own koudens" ON koudens;
DROP POLICY IF EXISTS "Users can insert their own koudens" ON koudens;
DROP POLICY IF EXISTS "Users can update their own koudens" ON koudens;
DROP POLICY IF EXISTS "Users can delete their own koudens" ON koudens;

DROP POLICY IF EXISTS "Users can view entries of their koudens" ON kouden_entries;
DROP POLICY IF EXISTS "Users can insert entries to their koudens" ON kouden_entries;
DROP POLICY IF EXISTS "Users can update entries of their koudens" ON kouden_entries;
DROP POLICY IF EXISTS "Users can delete entries of their koudens" ON kouden_entries;

DROP POLICY IF EXISTS "Users can view offerings of their koudens" ON offerings;
DROP POLICY IF EXISTS "Users can insert offerings to their koudens" ON offerings;
DROP POLICY IF EXISTS "Users can update offerings of their koudens" ON offerings;
DROP POLICY IF EXISTS "Users can delete offerings of their koudens" ON offerings;

DROP POLICY IF EXISTS "Users can view return_items of their koudens" ON return_items;
DROP POLICY IF EXISTS "Users can insert return_items to their koudens" ON return_items;
DROP POLICY IF EXISTS "Users can update return_items of their koudens" ON return_items;
DROP POLICY IF EXISTS "Users can delete return_items of their koudens" ON return_items;

-- Drop existing indexes if they exist
DROP INDEX IF EXISTS idx_koudens_owner_id;
DROP INDEX IF EXISTS idx_koudens_created_by;
DROP INDEX IF EXISTS idx_kouden_entries_kouden_id;
DROP INDEX IF EXISTS idx_kouden_entries_created_by;
DROP INDEX IF EXISTS idx_offerings_kouden_entry_id;
DROP INDEX IF EXISTS idx_return_items_kouden_entry_id;

-- Enable Row Level Security
ALTER TABLE koudens ENABLE ROW LEVEL SECURITY;
ALTER TABLE kouden_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE offerings ENABLE ROW LEVEL SECURITY;
ALTER TABLE return_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own koudens"
    ON koudens FOR SELECT
    USING (
        auth.uid()::uuid = owner_id
        OR auth.uid()::uuid = ANY(shared_user_ids)
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

-- Create RLS policies for kouden_entries
CREATE POLICY "Users can view entries of their koudens"
    ON kouden_entries FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM koudens
            WHERE koudens.id = kouden_entries.kouden_id
            AND (
                koudens.owner_id = auth.uid()::uuid
                OR auth.uid()::uuid = ANY(koudens.shared_user_ids)
            )
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

-- Create RLS policies for offerings
CREATE POLICY "Users can view offerings of their koudens"
    ON offerings FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM kouden_entries
            JOIN koudens ON koudens.id = kouden_entries.kouden_id
            WHERE kouden_entries.id = offerings.kouden_entry_id
            AND (
                koudens.owner_id = auth.uid()::uuid
                OR auth.uid()::uuid = ANY(koudens.shared_user_ids)
            )
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

-- Create RLS policies for return_items
CREATE POLICY "Users can view return_items of their koudens"
    ON return_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM kouden_entries
            JOIN koudens ON koudens.id = kouden_entries.kouden_id
            WHERE kouden_entries.id = return_items.kouden_entry_id
            AND (
                koudens.owner_id = auth.uid()::uuid
                OR auth.uid()::uuid = ANY(koudens.shared_user_ids)
            )
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

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create indexes
CREATE INDEX idx_koudens_owner_id ON koudens(owner_id);
CREATE INDEX idx_koudens_created_by ON koudens(created_by);
CREATE INDEX idx_kouden_entries_kouden_id ON kouden_entries(kouden_id);
CREATE INDEX idx_kouden_entries_created_by ON kouden_entries(created_by);
CREATE INDEX idx_offerings_kouden_entry_id ON offerings(kouden_entry_id);
CREATE INDEX idx_return_items_kouden_entry_id ON return_items(kouden_entry_id); 