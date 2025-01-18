-- ロールテーブルを作成
CREATE TABLE IF NOT EXISTS kouden_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    kouden_id UUID NOT NULL REFERENCES koudens(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(kouden_id, name)
);

-- メンバーテーブルを作成
CREATE TABLE IF NOT EXISTS kouden_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    kouden_id UUID NOT NULL REFERENCES koudens(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES kouden_roles(id) ON DELETE CASCADE,
    added_by UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(kouden_id, user_id)
);

-- 更新日時を自動更新するトリガーを作成
DROP TRIGGER IF EXISTS set_updated_at ON kouden_roles;
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON kouden_roles
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON kouden_members;
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON kouden_members
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_updated_at();

-- インデックスを作成
DO $$
BEGIN
    -- kouden_rolesのインデックス
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_kouden_roles_kouden_id'
    ) THEN
        CREATE INDEX idx_kouden_roles_kouden_id ON kouden_roles(kouden_id);
    END IF;

    -- kouden_membersのインデックス
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_kouden_members_kouden_id'
    ) THEN
        CREATE INDEX idx_kouden_members_kouden_id ON kouden_members(kouden_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_kouden_members_user_id'
    ) THEN
        CREATE INDEX idx_kouden_members_user_id ON kouden_members(user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_kouden_members_role_id'
    ) THEN
        CREATE INDEX idx_kouden_members_role_id ON kouden_members(role_id);
    END IF;
END
$$;

-- RLSを有効化
ALTER TABLE kouden_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE kouden_members ENABLE ROW LEVEL SECURITY;

-- kouden_rolesのポリシー
DROP POLICY IF EXISTS "owner_role_access" ON kouden_roles;
DROP POLICY IF EXISTS "member_role_read" ON kouden_roles;

-- 1. メンバーとオーナーのアクセスポリシー（SELECT）
CREATE POLICY "authenticated_role_access" ON kouden_roles
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM koudens
            WHERE koudens.id = kouden_id
            AND (
                koudens.owner_id = auth.uid()
                OR koudens.created_by = auth.uid()
                OR EXISTS (
                    SELECT 1
                    FROM kouden_members
                    WHERE kouden_members.kouden_id = koudens.id
                    AND kouden_members.user_id = auth.uid()
                )
            )
        )
    );

-- 2. オーナー管理ポリシー（全ての操作）
CREATE POLICY "owner_role_management" ON kouden_roles
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM koudens
            WHERE koudens.id = kouden_id
            AND (
                koudens.owner_id = auth.uid()
                OR koudens.created_by = auth.uid()
            )
        )
    );

-- kouden_membersのポリシー
DROP POLICY IF EXISTS "owner_member_access" ON kouden_members;
DROP POLICY IF EXISTS "member_read_access" ON kouden_members;

-- 1. メンバーとオーナーのアクセスポリシー（SELECT）
CREATE POLICY "members_basic_access" ON kouden_members
    FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1
            FROM koudens
            WHERE koudens.id = kouden_id
            AND (
                koudens.owner_id = auth.uid()
                OR koudens.created_by = auth.uid()
            )
        )
    );

-- 2. オーナー管理ポリシー（INSERT, UPDATE, DELETE）
CREATE POLICY "members_owner_management" ON kouden_members
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM koudens
            WHERE koudens.id = kouden_id
            AND (
                koudens.owner_id = auth.uid()
                OR koudens.created_by = auth.uid()
            )
        )
    );

-- 3. メンバー招待ポリシー（INSERT）
CREATE POLICY "members_invitation_insert" ON kouden_members
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM kouden_invitations
            WHERE kouden_invitations.kouden_id = kouden_id
            AND kouden_invitations.role_id = role_id
            AND kouden_invitations.status = 'pending'
        )
    );

-- メンバー管理用の関数
CREATE OR REPLACE FUNCTION update_member_role(
    p_kouden_id UUID,
    p_user_id UUID,
    p_role_id UUID
) RETURNS void AS $$
BEGIN
    -- メンバーの存在確認
    IF NOT EXISTS (
        SELECT 1 FROM kouden_members
        WHERE kouden_id = p_kouden_id
        AND user_id = p_user_id
    ) THEN
        RAISE EXCEPTION 'メンバーが見つかりません';
    END IF;

    -- ロールの存在確認
    IF NOT EXISTS (
        SELECT 1 FROM kouden_roles
        WHERE id = p_role_id
        AND kouden_id = p_kouden_id
    ) THEN
        RAISE EXCEPTION 'ロールが見つかりません';
    END IF;

    -- ロールを更新
    UPDATE kouden_members
    SET role_id = p_role_id,
        updated_at = now()
    WHERE kouden_id = p_kouden_id
    AND user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION remove_member(
    p_kouden_id UUID,
    p_user_id UUID
) RETURNS void AS $$
BEGIN
    -- メンバーの存在確認
    IF NOT EXISTS (
        SELECT 1 FROM kouden_members
        WHERE kouden_id = p_kouden_id
        AND user_id = p_user_id
    ) THEN
        RAISE EXCEPTION 'メンバーが見つかりません';
    END IF;

    -- メンバーを削除
    DELETE FROM kouden_members
    WHERE kouden_id = p_kouden_id
    AND user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 