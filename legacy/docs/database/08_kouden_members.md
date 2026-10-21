# kouden_members テーブル

香典帳のメンバー情報を管理するテーブルです。

## テーブル定義

```sql
CREATE TABLE public.kouden_members (
    id uuid DEFAULT uuid_generate_v4() NOT NULL,
    kouden_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    added_by uuid NOT NULL,
    invitation_id uuid
);
```

## カラム

| カラム名 | データ型 | NULL | デフォルト | 説明 |
|---------|----------|------|------------|------|
| id | uuid | NO | uuid_generate_v4() | 主キー |
| kouden_id | uuid | NO | - | 所属する香典帳のID |
| user_id | uuid | NO | - | メンバーのユーザーID |
| role_id | uuid | NO | - | メンバーのロールID |
| created_at | timestamp with time zone | NO | timezone('utc'::text, now()) | 作成日時 |
| updated_at | timestamp with time zone | NO | timezone('utc'::text, now()) | 更新日時 |
| added_by | uuid | NO | - | メンバーを追加したユーザーのID |
| invitation_id | uuid | YES | - | 招待から追加された場合の招待ID |

## インデックス

```sql
-- 主キーインデックス
CREATE UNIQUE INDEX kouden_members_pkey ON public.kouden_members USING btree (id);

-- 香典帳とユーザーの組み合わせのユニーク制約
CREATE UNIQUE INDEX kouden_members_kouden_id_user_id_key ON public.kouden_members USING btree (kouden_id, user_id);

-- 香典帳IDによる検索用インデックス
CREATE INDEX idx_kouden_members_kouden_id ON public.kouden_members USING btree (kouden_id);

-- ユーザーIDによる検索用インデックス
CREATE INDEX idx_kouden_members_user_id ON public.kouden_members USING btree (user_id);

-- ユーザーと香典帳の組み合わせによる検索用インデックス
CREATE INDEX idx_kouden_members_user_kouden ON public.kouden_members USING btree (user_id, kouden_id);
```

## 外部キー制約

```sql
-- メンバーを追加したユーザーの外部キー制約
ALTER TABLE ONLY public.kouden_members
    ADD CONSTRAINT kouden_members_added_by_fkey FOREIGN KEY (added_by) REFERENCES auth.users(id);

-- 香典帳IDの外部キー制約
ALTER TABLE ONLY public.kouden_members
    ADD CONSTRAINT kouden_members_kouden_id_fkey FOREIGN KEY (kouden_id) REFERENCES public.koudens(id);

-- ロールIDの外部キー制約
ALTER TABLE ONLY public.kouden_members
    ADD CONSTRAINT kouden_members_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.kouden_roles(id);

-- メンバーのユーザーIDの外部キー制約
ALTER TABLE ONLY public.kouden_members
    ADD CONSTRAINT kouden_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
```

## RLSポリシー

```sql
-- メンバー管理ポリシー（追加者による管理）
CREATE POLICY members_management ON public.kouden_members
    FOR ALL
    TO authenticated
    USING (added_by = auth.uid())
    WITH CHECK (added_by = auth.uid());

-- メンバーの基本アクセスポリシー（全員閲覧可能）
CREATE POLICY members_basic_access ON public.kouden_members
    FOR SELECT
    TO authenticated
    USING (true);

-- メンバーの更新ポリシー（所有者のみ）
CREATE POLICY members_owner_update ON public.kouden_members
    FOR UPDATE
    TO authenticated
    USING (EXISTS (
        SELECT 1
        FROM koudens
        WHERE koudens.id = kouden_members.kouden_id
        AND koudens.owner_id = auth.uid()
    ));

-- メンバーの削除ポリシー（所有者のみ）
CREATE POLICY members_owner_delete ON public.kouden_members
    FOR DELETE
    TO authenticated
    USING (EXISTS (
        SELECT 1
        FROM koudens
        WHERE koudens.id = kouden_members.kouden_id
        AND koudens.owner_id = auth.uid()
    ));

-- 招待からのメンバー追加ポリシー
CREATE POLICY members_invitation_insert ON public.kouden_members
    FOR INSERT
    TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1
        FROM kouden_invitations
        WHERE kouden_invitations.id = kouden_members.invitation_id
        AND kouden_invitations.invitation_token = current_setting('app.current_invitation_token'::text, true)::uuid
        AND kouden_invitations.status = 'pending'::invitation_status
        AND kouden_invitations.expires_at > now()
        AND (kouden_invitations.max_uses IS NULL OR kouden_invitations.used_count < kouden_invitations.max_uses)
    ));
```

## 関連するテーブル

- [koudens](./koudens.md) - 香典帳（kouden_id）
- [users](./users.md) - ユーザー（user_id, added_by）
- [kouden_roles](./kouden_roles.md) - 香典帳のロール（role_id）
- [kouden_invitations](./kouden_invitations.md) - 香典帳への招待（invitation_id）

## 備考

- 香典帳のメンバー情報を管理する中心的なテーブルです
- 同一ユーザーは同一香典帳に一度しか登録できません（ユニーク制約）
- RLSポリシーにより、以下のアクセス制御が実装されています：
  - メンバー情報は全ての認証済みユーザーが閲覧可能
  - メンバーの追加は招待経由か、追加者本人のみ可能
  - メンバーの更新・削除は香典帳の所有者のみ可能
- 招待からのメンバー追加時は、招待の有効性（期限、使用回数）が確認されます 