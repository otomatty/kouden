-- 共有メンバーテーブルの作成
CREATE TABLE IF NOT EXISTS kouden_members (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    -- 所属する香典帳のID
    kouden_id UUID NOT NULL REFERENCES koudens(id) ON DELETE CASCADE,
    -- メンバーのユーザーID
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    -- 権限（viewer/editor）
    role TEXT NOT NULL CHECK (role IN ('viewer', 'editor')),
    -- 作成日時
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    -- 更新日時
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    -- 作成者のユーザーID
    created_by UUID NOT NULL REFERENCES auth.users(id),
    -- 香典帳とユーザーの組み合わせはユニーク
    UNIQUE(kouden_id, user_id)
);

-- 招待テーブルの作成
CREATE TABLE IF NOT EXISTS kouden_invitations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    -- 所属する香典帳のID
    kouden_id UUID NOT NULL REFERENCES koudens(id) ON DELETE CASCADE,
    -- 招待するメールアドレス
    email TEXT NOT NULL,
    -- 権限（viewer/editor）
    role TEXT NOT NULL CHECK (role IN ('viewer', 'editor')),
    -- 招待トークン
    invitation_token UUID DEFAULT uuid_generate_v4() NOT NULL,
    -- 有効期限
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    -- 承認日時
    accepted_at TIMESTAMP WITH TIME ZONE,
    -- 作成日時
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    -- 更新日時
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    -- 作成者のユーザーID
    created_by UUID NOT NULL REFERENCES auth.users(id),
    -- 香典帳とメールアドレスの組み合わせはユニーク
    UNIQUE(kouden_id, email)
);

-- インデックスの作成
CREATE INDEX idx_kouden_members_kouden_id ON kouden_members(kouden_id);
CREATE INDEX idx_kouden_members_user_id ON kouden_members(user_id);
CREATE INDEX idx_kouden_invitations_kouden_id ON kouden_invitations(kouden_id);
CREATE INDEX idx_kouden_invitations_email ON kouden_invitations(email);
CREATE INDEX idx_kouden_invitations_invitation_token ON kouden_invitations(invitation_token);

-- Row Level Securityの有効化
ALTER TABLE kouden_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE kouden_invitations ENABLE ROW LEVEL SECURITY;

-- kouden_membersのRLSポリシー
CREATE POLICY "Users can view members of their koudens"
    ON kouden_members FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM koudens
            WHERE koudens.id = kouden_members.kouden_id
            AND (
                koudens.owner_id = auth.uid()::uuid
                OR EXISTS (
                    SELECT 1 FROM kouden_members AS km
                    WHERE km.kouden_id = koudens.id
                    AND km.user_id = auth.uid()::uuid
                )
            )
        )
    );

CREATE POLICY "Users can manage members of their koudens"
    ON kouden_members FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM koudens
            WHERE koudens.id = kouden_members.kouden_id
            AND koudens.owner_id = auth.uid()::uuid
        )
    );

-- kouden_invitationsのRLSポリシー
CREATE POLICY "Users can view invitations of their koudens"
    ON kouden_invitations FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM koudens
            WHERE koudens.id = kouden_invitations.kouden_id
            AND koudens.owner_id = auth.uid()::uuid
        )
    );

CREATE POLICY "Users can manage invitations of their koudens"
    ON kouden_invitations FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM koudens
            WHERE koudens.id = kouden_invitations.kouden_id
            AND koudens.owner_id = auth.uid()::uuid
        )
    );

-- koudensテーブルのRLSポリシーの更新
DROP POLICY IF EXISTS "Users can view their own koudens" ON koudens;
CREATE POLICY "Users can view their own koudens"
    ON koudens FOR SELECT
    USING (
        auth.uid()::uuid = owner_id
        OR EXISTS (
            SELECT 1 FROM kouden_members
            WHERE kouden_members.kouden_id = koudens.id
            AND kouden_members.user_id = auth.uid()::uuid
        )
    );

-- kouden_entriesテーブルのRLSポリシーの更新
DROP POLICY IF EXISTS "Users can view entries of their koudens" ON kouden_entries;
CREATE POLICY "Users can view entries of their koudens"
    ON kouden_entries FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM koudens
            WHERE koudens.id = kouden_entries.kouden_id
            AND (
                koudens.owner_id = auth.uid()::uuid
                OR EXISTS (
                    SELECT 1 FROM kouden_members
                    WHERE kouden_members.kouden_id = koudens.id
                    AND kouden_members.user_id = auth.uid()::uuid
                )
            )
        )
    );

DROP POLICY IF EXISTS "Users can insert entries to their koudens" ON kouden_entries;
CREATE POLICY "Users can insert entries to their koudens"
    ON kouden_entries FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM koudens
            WHERE koudens.id = kouden_id
            AND (
                koudens.owner_id = auth.uid()::uuid
                OR EXISTS (
                    SELECT 1 FROM kouden_members
                    WHERE kouden_members.kouden_id = koudens.id
                    AND kouden_members.user_id = auth.uid()::uuid
                    AND kouden_members.role = 'editor'
                )
            )
        )
        AND auth.uid()::uuid = created_by
    );

DROP POLICY IF EXISTS "Users can update entries of their koudens" ON kouden_entries;
CREATE POLICY "Users can update entries of their koudens"
    ON kouden_entries FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM koudens
            WHERE koudens.id = kouden_entries.kouden_id
            AND (
                koudens.owner_id = auth.uid()::uuid
                OR EXISTS (
                    SELECT 1 FROM kouden_members
                    WHERE kouden_members.kouden_id = koudens.id
                    AND kouden_members.user_id = auth.uid()::uuid
                    AND kouden_members.role = 'editor'
                )
            )
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM koudens
            WHERE koudens.id = kouden_entries.kouden_id
            AND (
                koudens.owner_id = auth.uid()::uuid
                OR EXISTS (
                    SELECT 1 FROM kouden_members
                    WHERE kouden_members.kouden_id = koudens.id
                    AND kouden_members.user_id = auth.uid()::uuid
                    AND kouden_members.role = 'editor'
                )
            )
        )
    );

DROP POLICY IF EXISTS "Users can delete entries of their koudens" ON kouden_entries;
CREATE POLICY "Users can delete entries of their koudens"
    ON kouden_entries FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM koudens
            WHERE koudens.id = kouden_entries.kouden_id
            AND (
                koudens.owner_id = auth.uid()::uuid
                OR EXISTS (
                    SELECT 1 FROM kouden_members
                    WHERE kouden_members.kouden_id = koudens.id
                    AND kouden_members.user_id = auth.uid()::uuid
                    AND kouden_members.role = 'editor'
                )
            )
        )
    );

-- shared_user_idsカラムの削除（データ移行後に実行）
-- ALTER TABLE koudens DROP COLUMN shared_user_ids; 