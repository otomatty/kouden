-- 更新日時を自動設定するトリガー関数を作成
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 招待のステータスを定義
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invitation_status') THEN
        CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'rejected', 'expired', 'canceled');
    END IF;
END
$$;

-- 招待テーブルを作成
CREATE TABLE IF NOT EXISTS kouden_invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    kouden_id UUID NOT NULL REFERENCES koudens(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role_id UUID NOT NULL REFERENCES kouden_roles(id) ON DELETE CASCADE,
    invitation_token UUID DEFAULT gen_random_uuid() NOT NULL UNIQUE,
    status invitation_status DEFAULT 'pending' NOT NULL,
    created_by UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    expires_at TIMESTAMPTZ DEFAULT (now() + interval '24 hours') NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 更新日時を自動更新するトリガーを作成
DROP TRIGGER IF EXISTS set_updated_at ON kouden_invitations;
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON kouden_invitations
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_updated_at();

-- インデックスを作成
DO $$
BEGIN
    -- kouden_idのインデックス
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_kouden_invitations_kouden_id'
    ) THEN
        CREATE INDEX idx_kouden_invitations_kouden_id ON kouden_invitations(kouden_id);
    END IF;

    -- emailのインデックス
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_kouden_invitations_email'
    ) THEN
        CREATE INDEX idx_kouden_invitations_email ON kouden_invitations(email);
    END IF;

    -- tokenのインデックス
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_kouden_invitations_token'
    ) THEN
        CREATE INDEX idx_kouden_invitations_token ON kouden_invitations(invitation_token);
    END IF;

    -- statusのインデックス
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_kouden_invitations_status'
    ) THEN
        CREATE INDEX idx_kouden_invitations_status ON kouden_invitations(status);
    END IF;
END
$$;

-- RLSを有効化
ALTER TABLE kouden_invitations ENABLE ROW LEVEL SECURITY;

-- オーナー用のポリシー（全ての操作を許可）
DROP POLICY IF EXISTS "owner_invitation_access" ON kouden_invitations;
CREATE POLICY "owner_invitation_access" ON kouden_invitations
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
DROP POLICY IF EXISTS "member_invitation_read" ON kouden_invitations;
CREATE POLICY "member_invitation_read" ON kouden_invitations
FOR SELECT
TO public
USING (
    EXISTS (
        SELECT 1 FROM koudens k
        WHERE k.id = kouden_id
        AND k.owner_id = auth.uid()
    )
);

-- 招待された人用のポリシー（トークンによる検証）
DROP POLICY IF EXISTS "invitee_access" ON kouden_invitations;
CREATE POLICY "invitee_access" ON kouden_invitations
FOR SELECT
TO public
USING (
    email = (
        SELECT email FROM profiles
        WHERE id = auth.uid()
    )
    AND status = 'pending'
    AND expires_at > now()
);

-- 招待を作成する関数
CREATE OR REPLACE FUNCTION create_invitation(
    p_kouden_id uuid,
    p_email text,
    p_role_id uuid,
    p_created_by uuid,
    p_type invitation_type DEFAULT 'email',
    p_max_uses integer DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_invitation_id UUID;
BEGIN
    -- メールタイプの場合のみ既存の有効な招待をチェック
    IF p_type = 'email' THEN
        IF EXISTS (
            SELECT 1 FROM kouden_invitations
            WHERE kouden_id = p_kouden_id
            AND email = p_email
            AND status = 'pending'
            AND expires_at > now()
        ) THEN
            RAISE EXCEPTION 'すでに有効な招待が存在します';
        END IF;
    END IF;

    -- 新しい招待を作成
    INSERT INTO kouden_invitations (
        kouden_id,
        email,
        role_id,
        created_by,
        invitation_type,
        max_uses,
        expires_at
    ) VALUES (
        p_kouden_id,
        p_email,
        p_role_id,
        p_created_by,
        p_type,
        p_max_uses,
        now() + interval '24 hours'
    ) RETURNING id INTO v_invitation_id;

    RETURN v_invitation_id;
END;
$$;

-- 招待を承認する関数
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

    -- 共有リンクの場合、使用回数制限をチェック
    IF v_invitation.invitation_type = 'share' AND v_invitation.max_uses IS NOT NULL THEN
        IF v_invitation.used_count >= v_invitation.max_uses THEN
            RAISE EXCEPTION '招待リンクの使用回数制限に達しました';
        END IF;
    END IF;

    -- メンバーとして追加
    INSERT INTO kouden_members (
        kouden_id,
        user_id,
        role_id,
        added_by,
        invitation_id
    ) VALUES (
        v_invitation.kouden_id,
        p_user_id,
        v_invitation.role_id,
        v_invitation.created_by,
        v_invitation.id
    );

    -- 招待のステータスを更新
    UPDATE kouden_invitations
    SET status = 'accepted',
        updated_at = now()
    WHERE id = v_invitation.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 