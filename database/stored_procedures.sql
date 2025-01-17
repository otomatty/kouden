-- 招待承認のためのストアドプロシージャ
CREATE OR REPLACE FUNCTION accept_invitation(
    p_invitation_token UUID,
    p_user_id UUID
) RETURNS void AS $$
DECLARE
    v_invitation RECORD;
BEGIN
    -- 招待情報を取得
    SELECT * INTO v_invitation
    FROM kouden_invitations
    WHERE invitation_token = p_invitation_token
    AND status = 'pending'
    FOR UPDATE;

    -- 招待が存在しない場合はエラー
    IF NOT FOUND THEN
        RAISE EXCEPTION '招待が見つからないか、既に処理されています';
    END IF;

    -- 有効期限をチェック
    IF v_invitation.expires_at < NOW() THEN
        UPDATE kouden_invitations
        SET status = 'expired'
        WHERE invitation_token = p_invitation_token;
        
        RAISE EXCEPTION '招待の有効期限が切れています';
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
    SET status = 'accepted'
    WHERE invitation_token = p_invitation_token;

EXCEPTION
    WHEN unique_violation THEN
        RAISE EXCEPTION 'すでにメンバーとして登録されています';
END;
$$ LANGUAGE plpgsql; 