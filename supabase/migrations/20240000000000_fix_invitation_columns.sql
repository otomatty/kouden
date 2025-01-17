-- カラム名の変更
ALTER TABLE kouden_invitations RENAME COLUMN token TO invitation_token;
ALTER TABLE kouden_invitations RENAME COLUMN invited_by TO created_by;

-- 関数の更新
CREATE OR REPLACE FUNCTION create_invitation(
    p_kouden_id UUID,
    p_email TEXT,
    p_role_id UUID,
    p_created_by UUID
) RETURNS UUID AS $$
DECLARE
    v_invitation_id UUID;
BEGIN
    -- 既存の有効な招待がないか確認
    IF EXISTS (
        SELECT 1 FROM kouden_invitations
        WHERE kouden_id = p_kouden_id
        AND email = p_email
        AND status = 'pending'
        AND expires_at > now()
    ) THEN
        RAISE EXCEPTION 'すでに有効な招待が存在します';
    END IF;

    -- 新しい招待を作成
    INSERT INTO kouden_invitations (
        kouden_id,
        email,
        role_id,
        created_by
    ) VALUES (
        p_kouden_id,
        p_email,
        p_role_id,
        p_created_by
    ) RETURNING id INTO v_invitation_id;

    RETURN v_invitation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- accept_invitation関数の更新
CREATE OR REPLACE FUNCTION accept_invitation(
    p_invitation_token UUID,
    p_user_id UUID
) RETURNS void AS $$
DECLARE
    v_invitation kouden_invitations%ROWTYPE;
BEGIN
    -- 招待を取得
    SELECT * INTO v_invitation
    FROM kouden_invitations
    WHERE invitation_token = p_invitation_token
    AND status = 'pending'
    AND expires_at > now();

    -- 招待が見つからない場合
    IF v_invitation.id IS NULL THEN
        RAISE EXCEPTION '有効な招待が見つかりません';
    END IF;

    -- メンバーとして追加
    INSERT INTO kouden_members (
        kouden_id,
        user_id,
        role_id,
        added_by
    ) VALUES (
        v_invitation.kouden_id,
        p_user_id,
        v_invitation.role_id,
        v_invitation.created_by
    );

    -- 招待のステータスを更新
    UPDATE kouden_invitations
    SET status = 'accepted',
        updated_at = now()
    WHERE id = v_invitation.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 