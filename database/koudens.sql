-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist
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
    -- 香典帳の状態（active/archived）
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived'))
);

-- Drop existing triggers
DROP TRIGGER IF EXISTS update_koudens_updated_at ON koudens;

-- Create trigger for updated_at
CREATE TRIGGER update_koudens_updated_at
    BEFORE UPDATE ON koudens
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Drop existing indexes
DROP INDEX IF EXISTS idx_koudens_owner_id;
DROP INDEX IF EXISTS idx_koudens_created_by;

-- Create indexes
CREATE INDEX idx_koudens_owner_id ON koudens(owner_id);
CREATE INDEX idx_koudens_created_by ON koudens(created_by);

-- Enable Row Level Security
ALTER TABLE koudens ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "authenticated_access" ON koudens;
DROP POLICY IF EXISTS "invitation_access" ON koudens;
DROP POLICY IF EXISTS "owner_management" ON koudens;

-- 1. メンバーとオーナーのアクセスポリシー（SELECT）
CREATE POLICY "authenticated_access" ON koudens
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM kouden_members
            WHERE kouden_members.kouden_id = koudens.id
            AND kouden_members.user_id = auth.uid()
        )
        OR owner_id = auth.uid()
        OR created_by = auth.uid()
    );

-- 2. オーナー管理ポリシー（全ての操作）
CREATE POLICY "owner_management" ON koudens
    FOR ALL
    TO authenticated
    USING (
        owner_id = auth.uid()
        OR created_by = auth.uid()
    )
    WITH CHECK (
        owner_id = auth.uid()
        OR created_by = auth.uid()
    );

-- 3. 招待用の閲覧ポリシー（SELECT）
CREATE POLICY "invitation_access" ON koudens
    FOR SELECT
    TO public
    USING (
        EXISTS (
            SELECT 1
            FROM kouden_invitations
            WHERE kouden_invitations.kouden_id = koudens.id
            AND kouden_invitations.status = 'pending'
            AND kouden_invitations.expires_at > now()
            AND kouden_invitations.invitation_type = 'share'
            AND (
                kouden_invitations.max_uses IS NULL
                OR kouden_invitations.used_count < kouden_invitations.max_uses
            )
        )
    ); 