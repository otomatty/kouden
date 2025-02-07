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

-- 更新日時を自動更新するトリガー
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$;

CREATE TRIGGER handle_koudens_updated_at
    BEFORE UPDATE ON koudens
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

-- オーナー自動メンバー登録トリガー
CREATE OR REPLACE FUNCTION handle_kouden_owner_membership()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    editor_role_id UUID;
BEGIN
    -- 編集者ロールのIDを取得
    SELECT id INTO editor_role_id
    FROM kouden_roles
    WHERE kouden_id = NEW.id AND name = 'editor'
    LIMIT 1;

    -- オーナーをメンバーとして追加
    INSERT INTO kouden_members (
        kouden_id,
        user_id,
        role_id,
        added_by
    )
    VALUES (
        NEW.id,
        NEW.owner_id,
        editor_role_id,
        NEW.created_by
    )
    ON CONFLICT (kouden_id, user_id) DO NOTHING;

    RETURN NEW;
END;
$$;

CREATE TRIGGER handle_kouden_owner_membership_insert
    AFTER INSERT ON koudens
    FOR EACH ROW
    EXECUTE FUNCTION handle_kouden_owner_membership();

CREATE TRIGGER handle_kouden_owner_membership_update
    AFTER UPDATE OF owner_id ON koudens
    FOR EACH ROW
    WHEN (OLD.owner_id IS DISTINCT FROM NEW.owner_id)
    EXECUTE FUNCTION handle_kouden_owner_membership();

-- オーナー変更前のチェックトリガー
CREATE OR REPLACE FUNCTION check_kouden_owner_membership()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- 新しいオーナーがメンバーとして存在するか確認
    IF NOT EXISTS (
        SELECT 1
        FROM kouden_members
        WHERE kouden_id = NEW.id
        AND user_id = NEW.owner_id
    ) THEN
        RAISE EXCEPTION 'オーナーはメンバーとして登録されている必要があります';
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER check_kouden_owner_membership_update
    BEFORE UPDATE OF owner_id ON koudens
    FOR EACH ROW
    WHEN (OLD.owner_id IS DISTINCT FROM NEW.owner_id)
    EXECUTE FUNCTION check_kouden_owner_membership();

-- RLSポリシーの設定
ALTER TABLE koudens ENABLE ROW LEVEL SECURITY;

-- 香典帳の参照ポリシー
CREATE POLICY "メンバーのみ香典帳を参照可能" ON koudens
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM kouden_members
            WHERE kouden_id = id
            AND user_id = auth.uid()
        )
    );

-- 香典帳の作成ポリシー
CREATE POLICY "認証済みユーザーは香典帳を作成可能" ON koudens
    FOR INSERT
    WITH CHECK (auth.uid() = created_by);

-- 香典帳の更新ポリシー
CREATE POLICY "メンバーのみ香典帳を更新可能" ON koudens
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1
            FROM kouden_members km
            JOIN kouden_roles kr ON kr.id = km.role_id
            WHERE km.kouden_id = id
            AND km.user_id = auth.uid()
            AND kr.name IN ('owner', 'editor')
        )
    );

-- インデックスの作成
CREATE INDEX koudens_owner_id_idx ON koudens(owner_id);
CREATE INDEX koudens_created_by_idx ON koudens(created_by);
CREATE INDEX koudens_status_idx ON koudens(status);

-- コメント
COMMENT ON TABLE koudens IS '香典帳テーブル';
COMMENT ON COLUMN koudens.id IS '香典帳ID';
COMMENT ON COLUMN koudens.title IS '香典帳タイトル';
COMMENT ON COLUMN koudens.description IS '香典帳の説明';
COMMENT ON COLUMN koudens.owner_id IS 'オーナーのユーザーID';
COMMENT ON COLUMN koudens.created_by IS '作成者のユーザーID';
COMMENT ON COLUMN koudens.created_at IS '作成日時';
COMMENT ON COLUMN koudens.updated_at IS '更新日時';
COMMENT ON COLUMN koudens.status IS 'ステータス（active/archived/deleted）'; 