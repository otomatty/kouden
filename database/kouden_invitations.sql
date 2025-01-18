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


DROP TABLE IF EXISTS kouden_invitations;
-- 招待テーブルを作成
CREATE TABLE IF NOT EXISTS kouden_invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    kouden_id UUID NOT NULL REFERENCES koudens(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES kouden_roles(id) ON DELETE CASCADE,
    invitation_token UUID DEFAULT gen_random_uuid() NOT NULL UNIQUE,
    status invitation_status DEFAULT 'pending' NOT NULL,
    created_by UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    expires_at TIMESTAMPTZ DEFAULT (now() + interval '7 days') NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    max_uses INTEGER,
    used_count INTEGER DEFAULT 0 NOT NULL,
    kouden_data JSONB,
    CONSTRAINT valid_kouden_data CHECK (
        CASE 
            WHEN kouden_data IS NOT NULL THEN
                kouden_data ? 'id' AND 
                kouden_data ? 'title' AND 
                kouden_data ? 'description'
            ELSE true
        END
    )
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

-- 招待リンクの閲覧ポリシー（トークンによる検証）
DROP POLICY IF EXISTS "invitation_link_access" ON kouden_invitations;
CREATE POLICY "invitation_link_access" ON kouden_invitations
FOR SELECT
TO public
USING (
    status = 'pending'
    AND expires_at > now()
    AND (max_uses IS NULL OR used_count < max_uses)
);

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