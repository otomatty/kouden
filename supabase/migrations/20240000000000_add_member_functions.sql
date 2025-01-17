-- メンバーのロールを更新する関数
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

-- メンバーを削除する関数
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