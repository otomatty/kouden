-- 1. 重複したインデックスの削除
DROP INDEX IF EXISTS idx_koudens_owner_created;

-- 2. 既存のポリシーを全て削除
DO $$
BEGIN
    -- すべてのポリシーを削除
    EXECUTE (
        SELECT string_agg(
            format('DROP POLICY IF EXISTS %I ON %I;', 
                   policyname, tablename),
            E'\n'
        )
        FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename IN ('koudens', 'kouden_members', 'kouden_roles')
    );
END;
$$;

-- 3. シンプルな基本ポリシーの作成
-- koudens テーブルのポリシー
CREATE POLICY "koudens_owner_access" ON koudens
    FOR ALL
    TO authenticated
    USING (owner_id = auth.uid());

CREATE POLICY "koudens_member_access" ON koudens
    FOR SELECT
    TO authenticated
    USING (status = 'active');

-- kouden_members テーブルのポリシー
CREATE POLICY "kouden_members_access" ON kouden_members
    FOR ALL
    TO authenticated
    USING (user_id = auth.uid());

-- kouden_roles テーブルのポリシー
CREATE POLICY "kouden_roles_access" ON kouden_roles
    FOR SELECT
    TO authenticated
    USING (true);

-- 4. トリガー関数の修正
CREATE OR REPLACE FUNCTION add_kouden_owner()
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

    IF editor_role_id IS NULL THEN
        RAISE EXCEPTION 'エディターロールが見つかりません。デフォルトロールが作成されていることを確認してください。';
    END IF;

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

-- 5. トリガーの実行順序を保証
DROP TRIGGER IF EXISTS trigger_add_kouden_owner ON koudens;
DROP TRIGGER IF EXISTS create_default_kouden_roles_trigger ON koudens;
DROP TRIGGER IF EXISTS trigger_initialize_default_relationships ON koudens;

CREATE TRIGGER create_default_kouden_roles_trigger
    AFTER INSERT ON koudens
    FOR EACH ROW
    EXECUTE FUNCTION create_default_kouden_roles();

CREATE TRIGGER trigger_add_kouden_owner
    AFTER INSERT ON koudens
    FOR EACH ROW
    EXECUTE FUNCTION add_kouden_owner();

CREATE TRIGGER trigger_initialize_default_relationships
    AFTER INSERT ON koudens
    FOR EACH ROW
    EXECUTE FUNCTION initialize_default_relationships(); 