-- Drop existing tables if they exist
DROP TABLE IF EXISTS kouden_members CASCADE;

-- Create kouden_members table (香典帳メンバーテーブル)
CREATE TABLE IF NOT EXISTS kouden_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kouden_id UUID NOT NULL REFERENCES koudens(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('viewer', 'editor')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (kouden_id, user_id)
);

-- 更新日時を自動更新するトリガー
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON kouden_members
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- RLSポリシー
ALTER TABLE kouden_members ENABLE ROW LEVEL SECURITY;

-- 閲覧ポリシー
CREATE POLICY "メンバーは香典帳のメンバー一覧を閲覧できる" ON kouden_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM kouden_members AS km
            WHERE km.kouden_id = kouden_members.kouden_id
            AND km.user_id = auth.uid()
        )
    );

-- 作成ポリシー
CREATE POLICY "オーナーは香典帳にメンバーを追加できる" ON kouden_members
    FOR INSERT WITH CHECK (
        (
            EXISTS (
                SELECT 1 FROM koudens
                WHERE koudens.id = kouden_members.kouden_id
                AND koudens.owner_id = auth.uid()
            )
        ) OR (
            -- トリガー関数からの挿入を許可
            auth.uid() IS NULL
        )
    );

-- 更新ポリシー
CREATE POLICY "オーナーはメンバーの権限を更新できる" ON kouden_members
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM koudens
            WHERE koudens.id = kouden_members.kouden_id
            AND koudens.owner_id = auth.uid()
        )
    );

-- 削除ポリシー
CREATE POLICY "オーナーはメンバーを削除できる" ON kouden_members
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM koudens
            WHERE koudens.id = kouden_members.kouden_id
            AND koudens.owner_id = auth.uid()
        )
    ); 