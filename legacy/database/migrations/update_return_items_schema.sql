-- 返礼品テーブルのスキーマを新しい設計に更新
-- 既存の return_items テーブルを backup し、新しいスキーマで再作成

-- 1. バックアップテーブルを作成
DO $$
BEGIN
    -- 既存データがある場合はバックアップ
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'return_items') THEN
        -- バックアップテーブル作成
        DROP TABLE IF EXISTS return_items_backup CASCADE;
        CREATE TABLE return_items_backup AS SELECT * FROM return_items;
        
        -- 既存テーブルを削除
        DROP TABLE return_items CASCADE;
    END IF;
END $$;

-- 2. 新しい return_items テーブルを作成（返礼品マスター）
CREATE TABLE IF NOT EXISTS return_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    -- 香典帳ID（直接参照）
    kouden_id UUID NOT NULL REFERENCES koudens(id) ON DELETE CASCADE,
    -- 返礼品名
    name TEXT NOT NULL,
    -- 説明
    description TEXT,
    -- 価格
    price INTEGER NOT NULL CHECK (price >= 0),
    -- カテゴリ
    category TEXT CHECK (category IN ('FUNERAL_GIFT', 'GIFT_CARD', 'FOOD', 'FLOWER', 'OTHER')),
    -- 画像URL
    image_url TEXT,
    -- アクティブ状態
    is_active BOOLEAN NOT NULL DEFAULT true,
    -- 表示順序
    sort_order INTEGER NOT NULL DEFAULT 1 CHECK (sort_order >= 1),
    -- 推奨金額（最小）
    recommended_amount_min INTEGER CHECK (recommended_amount_min >= 0),
    -- 推奨金額（最大）
    recommended_amount_max INTEGER CHECK (recommended_amount_max >= 0),
    -- 作成日時
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    -- 更新日時
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    -- 作成者のユーザーID（authテーブルの参照）
    created_by UUID NOT NULL REFERENCES auth.users(id),
    
    -- 制約
    CONSTRAINT valid_recommended_amount_range CHECK (
        recommended_amount_min IS NULL OR 
        recommended_amount_max IS NULL OR 
        recommended_amount_min <= recommended_amount_max
    )
);

-- 3. トリガーを作成
CREATE TRIGGER update_return_items_updated_at
    BEFORE UPDATE ON return_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 4. インデックスを作成
CREATE INDEX idx_return_items_kouden_id ON return_items(kouden_id);
CREATE INDEX idx_return_items_created_by ON return_items(created_by);
CREATE INDEX idx_return_items_sort_order ON return_items(sort_order);
CREATE INDEX idx_return_items_is_active ON return_items(is_active);

-- 5. Row Level Security を有効化
ALTER TABLE return_items ENABLE ROW LEVEL SECURITY;

-- 6. RLS ポリシーを作成
-- 閲覧権限：香典帳の所有者または権限を持つメンバー
CREATE POLICY "Users can view return_items of their koudens"
    ON return_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM koudens
            WHERE koudens.id = return_items.kouden_id
            AND koudens.owner_id = auth.uid()::uuid
        )
        OR EXISTS (
            SELECT 1 FROM kouden_members km
            JOIN kouden_roles kr ON km.role_id = kr.id
            WHERE km.kouden_id = return_items.kouden_id
            AND km.user_id = auth.uid()::uuid
            AND kr.permissions && ARRAY['view', 'edit']
        )
    );

-- 作成権限：香典帳の所有者または編集権限を持つメンバー
CREATE POLICY "Users can insert return_items to their koudens"
    ON return_items FOR INSERT
    WITH CHECK (
        (
            EXISTS (
                SELECT 1 FROM koudens
                WHERE koudens.id = kouden_id
                AND koudens.owner_id = auth.uid()::uuid
            )
            OR EXISTS (
                SELECT 1 FROM kouden_members km
                JOIN kouden_roles kr ON km.role_id = kr.id
                WHERE km.kouden_id = return_items.kouden_id
                AND km.user_id = auth.uid()::uuid
                AND 'edit' = ANY(kr.permissions)
            )
        )
        AND auth.uid()::uuid = created_by
    );

-- 更新権限：香典帳の所有者または編集権限を持つメンバー
CREATE POLICY "Users can update return_items of their koudens"
    ON return_items FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM koudens
            WHERE koudens.id = return_items.kouden_id
            AND koudens.owner_id = auth.uid()::uuid
        )
        OR EXISTS (
            SELECT 1 FROM kouden_members km
            JOIN kouden_roles kr ON km.role_id = kr.id
            WHERE km.kouden_id = return_items.kouden_id
            AND km.user_id = auth.uid()::uuid
            AND 'edit' = ANY(kr.permissions)
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM koudens
            WHERE koudens.id = return_items.kouden_id
            AND koudens.owner_id = auth.uid()::uuid
        )
        OR EXISTS (
            SELECT 1 FROM kouden_members km
            JOIN kouden_roles kr ON km.role_id = kr.id
            WHERE km.kouden_id = return_items.kouden_id
            AND km.user_id = auth.uid()::uuid
            AND 'edit' = ANY(kr.permissions)
        )
    );

-- 削除権限：香典帳の所有者または編集権限を持つメンバー
CREATE POLICY "Users can delete return_items of their koudens"
    ON return_items FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM koudens
            WHERE koudens.id = return_items.kouden_id
            AND koudens.owner_id = auth.uid()::uuid
        )
        OR EXISTS (
            SELECT 1 FROM kouden_members km
            JOIN kouden_roles kr ON km.role_id = kr.id
            WHERE km.kouden_id = return_items.kouden_id
            AND km.user_id = auth.uid()::uuid
            AND 'edit' = ANY(kr.permissions)
        )
    );

-- 7. コメントを追加
COMMENT ON TABLE return_items IS '返礼品マスターテーブル';
COMMENT ON COLUMN return_items.id IS '返礼品マスターID';
COMMENT ON COLUMN return_items.kouden_id IS '香典帳ID';
COMMENT ON COLUMN return_items.name IS '返礼品名';
COMMENT ON COLUMN return_items.description IS '説明';
COMMENT ON COLUMN return_items.price IS '価格';
COMMENT ON COLUMN return_items.category IS 'カテゴリ';
COMMENT ON COLUMN return_items.image_url IS '画像URL';
COMMENT ON COLUMN return_items.is_active IS 'アクティブ状態';
COMMENT ON COLUMN return_items.sort_order IS '表示順序';
COMMENT ON COLUMN return_items.recommended_amount_min IS '推奨金額（最小）';
COMMENT ON COLUMN return_items.recommended_amount_max IS '推奨金額（最大）';
COMMENT ON COLUMN return_items.created_at IS '作成日時';
COMMENT ON COLUMN return_items.updated_at IS '更新日時';
COMMENT ON COLUMN return_items.created_by IS '作成者のユーザーID'; 