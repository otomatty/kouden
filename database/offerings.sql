-- Drop existing tables if they exist
DROP TABLE IF EXISTS offering_photos CASCADE;
DROP TABLE IF EXISTS offering_entries CASCADE;
DROP TABLE IF EXISTS offerings CASCADE;

-- Create offerings table (供物テーブル)
CREATE TABLE IF NOT EXISTS offerings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    -- 所属する香典帳のID
    kouden_id UUID NOT NULL REFERENCES koudens(id) ON DELETE CASCADE,
    -- 供物の種類（供花/供物/その他）
    type TEXT NOT NULL CHECK (type IN ('FLOWER', 'FOOD', 'OTHER')),
    -- 供物の内容
    description TEXT,
    -- 数量
    quantity INTEGER NOT NULL DEFAULT 1,
    -- 価格（任意）
    price INTEGER,
    -- 提供者名（例：同級生一同）
    provider_name TEXT NOT NULL,
    -- 備考
    notes TEXT,
    -- 作成日時
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    -- 更新日時
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    -- 作成者のユーザーID（authテーブルの参照）
    created_by UUID NOT NULL REFERENCES auth.users(id)
);

-- Create offering_entries table (供物と香典の中間テーブル)
CREATE TABLE IF NOT EXISTS offering_entries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    -- 供物ID
    offering_id UUID NOT NULL REFERENCES offerings(id) ON DELETE CASCADE,
    -- 香典情報ID
    kouden_entry_id UUID NOT NULL REFERENCES kouden_entries(id) ON DELETE CASCADE,
    -- 作成日時
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    -- 作成者のユーザーID（authテーブルの参照）
    created_by UUID NOT NULL REFERENCES auth.users(id),
    -- 同じ供物と香典の組み合わせを防ぐ
    UNIQUE(offering_id, kouden_entry_id)
);

-- Create offering_photos table (供物の写真テーブル)
CREATE TABLE IF NOT EXISTS offering_photos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    -- 供物ID
    offering_id UUID NOT NULL REFERENCES offerings(id) ON DELETE CASCADE,
    -- 写真のStorage Key
    storage_key TEXT NOT NULL,
    -- 写真の説明
    caption TEXT,
    -- 作成日時
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    -- 更新日時
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    -- 作成者のユーザーID（authテーブルの参照）
    created_by UUID NOT NULL REFERENCES auth.users(id)
);

-- Drop existing triggers
DROP TRIGGER IF EXISTS update_offerings_updated_at ON offerings;
DROP TRIGGER IF EXISTS update_offering_photos_updated_at ON offering_photos;

-- Create triggers for updated_at
CREATE TRIGGER update_offerings_updated_at
    BEFORE UPDATE ON offerings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_offering_photos_updated_at
    BEFORE UPDATE ON offering_photos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Drop existing indexes
DROP INDEX IF EXISTS idx_offerings_created_by;
DROP INDEX IF EXISTS idx_offerings_kouden_id;
DROP INDEX IF EXISTS idx_offering_entries_offering_id;
DROP INDEX IF EXISTS idx_offering_entries_kouden_entry_id;
DROP INDEX IF EXISTS idx_offering_photos_offering_id;

-- Create indexes
CREATE INDEX idx_offerings_created_by ON offerings(created_by);
CREATE INDEX idx_offerings_kouden_id ON offerings(kouden_id);
CREATE INDEX idx_offering_entries_offering_id ON offering_entries(offering_id);
CREATE INDEX idx_offering_entries_kouden_entry_id ON offering_entries(kouden_entry_id);
CREATE INDEX idx_offering_photos_offering_id ON offering_photos(offering_id);

-- Enable Row Level Security
ALTER TABLE offerings ENABLE ROW LEVEL SECURITY;
ALTER TABLE offering_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE offering_photos ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view offerings of their koudens" ON offerings;
DROP POLICY IF EXISTS "Users can insert offerings" ON offerings;
DROP POLICY IF EXISTS "Users can update offerings of their koudens" ON offerings;
DROP POLICY IF EXISTS "Users can delete offerings of their koudens" ON offerings;

-- Create RLS policies for offerings
CREATE POLICY "Users can view offerings of their koudens"
    ON offerings FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM koudens k
            WHERE k.id = offerings.kouden_id
            AND (
                k.owner_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM kouden_members m
                    JOIN kouden_roles r ON m.role_id = r.id
                    WHERE m.kouden_id = k.id
                    AND m.user_id = auth.uid()
                    AND r.name IN ('編集者', '閲覧者')
                )
            )
        )
    );

CREATE POLICY "Users can insert offerings"
    ON offerings FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM koudens k
            WHERE k.id = kouden_id
            AND k.owner_id = auth.uid()
        )
        AND created_by = auth.uid()
    );

CREATE POLICY "Users can update offerings of their koudens"
    ON offerings FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM koudens k
            WHERE k.id = offerings.kouden_id
            AND k.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete offerings of their koudens"
    ON offerings FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM koudens k
            WHERE k.id = offerings.kouden_id
            AND k.owner_id = auth.uid()
        )
    );

-- Create RLS policies for offering_entries
CREATE POLICY "Users can view offering entries"
    ON offering_entries FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM kouden_entries ke
            JOIN koudens k ON k.id = ke.kouden_id
            WHERE ke.id = offering_entries.kouden_entry_id
            AND (
                k.owner_id = auth.uid()::uuid
                OR EXISTS (
                    SELECT 1 FROM kouden_members m
                    JOIN kouden_roles r ON m.role_id = r.id
                    WHERE m.kouden_id = k.id
                    AND m.user_id = auth.uid()::uuid
                    AND r.name IN ('編集者', '閲覧者')
                )
            )
        )
    );

CREATE POLICY "Users can insert offering entries"
    ON offering_entries FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM kouden_entries ke
            JOIN koudens k ON k.id = ke.kouden_id
            WHERE ke.id = kouden_entry_id
            AND (
                k.owner_id = auth.uid()::uuid
                OR EXISTS (
                    SELECT 1 FROM kouden_members m
                    JOIN kouden_roles r ON m.role_id = r.id
                    WHERE m.kouden_id = k.id
                    AND m.user_id = auth.uid()::uuid
                    AND r.name = '編集者'
                )
            )
        )
        AND auth.uid()::uuid = created_by
    );

CREATE POLICY "Users can delete offering entries"
    ON offering_entries FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM kouden_entries ke
            JOIN koudens k ON k.id = ke.kouden_id
            WHERE ke.id = offering_entries.kouden_entry_id
            AND (
                k.owner_id = auth.uid()::uuid
                OR EXISTS (
                    SELECT 1 FROM kouden_members m
                    JOIN kouden_roles r ON m.role_id = r.id
                    WHERE m.kouden_id = k.id
                    AND m.user_id = auth.uid()::uuid
                    AND r.name = '編集者'
                )
            )
        )
    );

-- Create RLS policies for offering_photos
CREATE POLICY "Users can view offering photos"
    ON offering_photos FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM offerings o
            JOIN offering_entries oe ON oe.offering_id = o.id
            JOIN kouden_entries ke ON ke.id = oe.kouden_entry_id
            JOIN koudens k ON k.id = ke.kouden_id
            WHERE o.id = offering_photos.offering_id
            AND (
                k.owner_id = auth.uid()::uuid
                OR EXISTS (
                    SELECT 1 FROM kouden_members m
                    JOIN kouden_roles r ON m.role_id = r.id
                    WHERE m.kouden_id = k.id
                    AND m.user_id = auth.uid()::uuid
                    AND r.name IN ('編集者', '閲覧者')
                )
            )
        )
    );

CREATE POLICY "Users can insert offering photos"
    ON offering_photos FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM offerings o
            JOIN offering_entries oe ON oe.offering_id = o.id
            JOIN kouden_entries ke ON ke.id = oe.kouden_entry_id
            JOIN koudens k ON k.id = ke.kouden_id
            WHERE o.id = offering_id
            AND (
                k.owner_id = auth.uid()::uuid
                OR EXISTS (
                    SELECT 1 FROM kouden_members m
                    JOIN kouden_roles r ON m.role_id = r.id
                    WHERE m.kouden_id = k.id
                    AND m.user_id = auth.uid()::uuid
                    AND r.name = '編集者'
                )
            )
        )
        AND auth.uid()::uuid = created_by
    );

CREATE POLICY "Users can update offering photos"
    ON offering_photos FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM offerings o
            JOIN offering_entries oe ON oe.offering_id = o.id
            JOIN kouden_entries ke ON ke.id = oe.kouden_entry_id
            JOIN koudens k ON k.id = ke.kouden_id
            WHERE o.id = offering_photos.offering_id
            AND (
                k.owner_id = auth.uid()::uuid
                OR EXISTS (
                    SELECT 1 FROM kouden_members m
                    JOIN kouden_roles r ON m.role_id = r.id
                    WHERE m.kouden_id = k.id
                    AND m.user_id = auth.uid()::uuid
                    AND r.name = '編集者'
                )
            )
        )
    );

CREATE POLICY "Users can delete offering photos"
    ON offering_photos FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM offerings o
            JOIN offering_entries oe ON oe.offering_id = o.id
            JOIN kouden_entries ke ON ke.id = oe.kouden_entry_id
            JOIN koudens k ON k.id = ke.kouden_id
            WHERE o.id = offering_photos.offering_id
            AND (
                k.owner_id = auth.uid()::uuid
                OR EXISTS (
                    SELECT 1 FROM kouden_members m
                    JOIN kouden_roles r ON m.role_id = r.id
                    WHERE m.kouden_id = k.id
                    AND m.user_id = auth.uid()::uuid
                    AND r.name = '編集者'
                )
            )
        )
    ); 