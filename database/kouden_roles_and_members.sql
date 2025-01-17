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
-- オーナー用のポリシー（全ての操作を許可）
DROP POLICY IF EXISTS "owner_role_access" ON kouden_roles;
CREATE POLICY "owner_role_access" ON kouden_roles
FOR ALL
TO public
USING (
    EXISTS (
        SELECT 1 FROM koudens k
        WHERE k.id = kouden_id
        AND k.owner_id = auth.uid()
    )
);

-- メンバー用の閲覧ポリシー（SELECTのみ）
DROP POLICY IF EXISTS "member_role_read" ON kouden_roles;
CREATE POLICY "member_role_read" ON kouden_roles
FOR SELECT
TO public
USING (
    EXISTS (
        SELECT 1 FROM koudens k
        WHERE k.id = kouden_id
        AND k.owner_id = auth.uid()
    )
);

-- kouden_membersのポリシー
-- オーナー用のポリシー（全ての操作を許可）
DROP POLICY IF EXISTS "owner_member_access" ON kouden_members;
CREATE POLICY "owner_member_access" ON kouden_members
FOR ALL
TO public
USING (
    EXISTS (
        SELECT 1 FROM koudens k
        WHERE k.id = kouden_id
        AND k.owner_id = auth.uid()
    )
);

-- メンバー用の閲覧ポリシー（SELECTのみ）
DROP POLICY IF EXISTS "member_read_access" ON kouden_members;
CREATE POLICY "member_read_access" ON kouden_members
FOR SELECT
TO public
USING (
    EXISTS (
        SELECT 1 FROM koudens k
        WHERE k.id = kouden_id
        AND k.owner_id = auth.uid()
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