-- 招待タイプの列挙型を作成
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invitation_type') THEN
        CREATE TYPE invitation_type AS ENUM ('email', 'share');
    END IF;
END
$$;

-- 招待テーブルに新しいカラムを追加
ALTER TABLE kouden_invitations
ADD COLUMN IF NOT EXISTS invitation_type invitation_type NOT NULL DEFAULT 'email',
ADD COLUMN IF NOT EXISTS max_uses integer NULL,
ADD COLUMN IF NOT EXISTS used_count integer NOT NULL DEFAULT 0;

-- メンバーテーブルに招待IDカラムを追加
ALTER TABLE kouden_members
ADD COLUMN IF NOT EXISTS invitation_id UUID REFERENCES kouden_invitations(id);

-- 共有リンクの使用回数を更新する関数
CREATE OR REPLACE FUNCTION increment_invitation_used_count()
RETURNS TRIGGER AS $$
BEGIN
    -- 招待IDがある場合のみカウントを更新
    IF NEW.invitation_id IS NOT NULL THEN
        UPDATE kouden_invitations
        SET used_count = used_count + 1
        WHERE id = NEW.invitation_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 使用回数を更新するトリガーを作成
DROP TRIGGER IF EXISTS increment_used_count ON kouden_members;
CREATE TRIGGER increment_used_count
    AFTER INSERT ON kouden_members
    FOR EACH ROW
    EXECUTE FUNCTION increment_invitation_used_count();

-- 既存のユニーク制約を削除
DROP INDEX IF EXISTS idx_pending_invitations;

-- 新しいユニーク制約を作成（メール招待の場合のみチェック）
CREATE UNIQUE INDEX idx_pending_invitations ON kouden_invitations (kouden_id, email)
WHERE status = 'pending' AND invitation_type = 'email' AND email IS NOT NULL;

-- invitation_tokenにインデックスを作成
CREATE INDEX IF NOT EXISTS idx_invitation_token ON kouden_invitations (invitation_token);

-- usersテーブルのRLSポリシーを追加
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to read their own user info"
    ON auth.users
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Allow users to read inviter info" ON auth.users;

CREATE POLICY "Allow users to read inviter info"
    ON auth.users
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM kouden_invitations
            WHERE kouden_invitations.created_by = auth.users.id
            AND kouden_invitations.created_by = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1
            FROM kouden_invitations
            WHERE kouden_invitations.created_by = auth.users.id
            AND kouden_invitations.email IS NOT NULL
            AND kouden_invitations.email = current_setting('request.jwt.claims')::json->>'email'
        )
    );

-- デバッグ用のログテーブルを作成
CREATE TABLE IF NOT EXISTS debug_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    action TEXT,
    user_id UUID,
    details JSONB
);

-- ログテーブルのRLSポリシーを設定
ALTER TABLE debug_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow insert debug logs"
    ON debug_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow read own debug logs"
    ON debug_logs
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- kouden_invitationsテーブルのRLSポリシーを設定
ALTER TABLE kouden_invitations ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Allow users to create invitations" ON kouden_invitations;
DROP POLICY IF EXISTS "Allow users to read invitations" ON kouden_invitations;
DROP POLICY IF EXISTS "Allow users to update invitations" ON kouden_invitations;

-- 招待トークンを生成する関数
CREATE OR REPLACE FUNCTION generate_invitation_token()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.invitation_token IS NULL THEN
        NEW.invitation_token := encode(gen_random_bytes(32), 'hex');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 招待トークンを自動生成するトリガー
DROP TRIGGER IF EXISTS set_invitation_token ON kouden_invitations;
CREATE TRIGGER set_invitation_token
    BEFORE INSERT ON kouden_invitations
    FOR EACH ROW
    EXECUTE FUNCTION generate_invitation_token();

-- 招待の作成ポリシー（オーナーと編集者のみが招待を作成可能）
CREATE POLICY "Allow users to create invitations"
    ON kouden_invitations
    FOR INSERT
    TO authenticated
    WITH CHECK (
        (
            -- オーナーの場合
            EXISTS (
                SELECT 1 FROM koudens k
                WHERE k.id = kouden_invitations.kouden_id
                AND k.owner_id = auth.uid()
            )
            OR
            -- 編集者の場合
            EXISTS (
                SELECT 1 
                FROM kouden_members m
                JOIN kouden_roles r ON r.id = m.role_id
                WHERE m.kouden_id = kouden_invitations.kouden_id
                AND m.user_id = auth.uid()
                AND r.name = '編集者'
            )
        )
        AND
        -- 招待時に指定できるロールは '編集者' または '閲覧者' のみ
        EXISTS (
            SELECT 1
            FROM kouden_roles r
            WHERE r.id = kouden_invitations.role_id
            AND r.kouden_id = kouden_invitations.kouden_id
            AND r.name IN ('編集者', '閲覧者')
        )
    );

-- 招待の読み取りポリシー
CREATE POLICY "Allow users to read invitations"
    ON kouden_invitations
    FOR SELECT
    TO authenticated
    USING (
        created_by = auth.uid()
        OR
        email = current_setting('request.jwt.claims')::json->>'email'
        OR
        EXISTS (
            SELECT 1 FROM koudens k
            WHERE k.id = kouden_invitations.kouden_id
            AND k.owner_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 
            FROM kouden_members m
            JOIN kouden_roles r ON r.id = m.role_id
            WHERE m.kouden_id = kouden_invitations.kouden_id
            AND m.user_id = auth.uid()
            AND r.name = '編集者'
        )
    );

-- 招待の更新ポリシー
CREATE POLICY "Allow users to update invitations"
    ON kouden_invitations
    FOR UPDATE
    TO authenticated
    USING (
        created_by = auth.uid()
        OR
        EXISTS (
            SELECT 1 FROM koudens k
            WHERE k.id = kouden_invitations.kouden_id
            AND k.owner_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 
            FROM kouden_members m
            JOIN kouden_roles r ON r.id = m.role_id
            WHERE m.kouden_id = kouden_invitations.kouden_id
            AND m.user_id = auth.uid()
            AND r.name = '編集者'
        )
    );

-- デバッグ用の関数を作成
CREATE OR REPLACE FUNCTION log_debug(
    p_action TEXT,
    p_details JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO debug_logs (action, user_id, details)
    VALUES (p_action, auth.uid(), p_details)
    RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$; 