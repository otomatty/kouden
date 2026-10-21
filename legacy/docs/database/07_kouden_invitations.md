# kouden_invitations テーブル

香典帳への招待情報を管理するテーブルです。

## テーブル定義

```sql
CREATE TABLE public.kouden_invitations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    kouden_id uuid NOT NULL,
    role_id uuid NOT NULL,
    invitation_token uuid DEFAULT gen_random_uuid() NOT NULL,
    status invitation_status DEFAULT 'pending'::invitation_status NOT NULL,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone DEFAULT (now() + '7 days'::interval) NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    max_uses integer,
    used_count integer DEFAULT 0 NOT NULL,
    kouden_data jsonb
);
```

## カラム

| カラム名 | データ型 | NULL | デフォルト | 説明 |
|---------|----------|------|------------|------|
| id | uuid | NO | gen_random_uuid() | 主キー |
| kouden_id | uuid | NO | - | 所属する香典帳のID |
| role_id | uuid | NO | - | 招待時に付与するロールID |
| invitation_token | uuid | NO | gen_random_uuid() | 招待トークン |
| status | invitation_status | NO | 'pending' | 招待の状態 |
| created_by | uuid | NO | - | 招待を作成したユーザーのID |
| created_at | timestamp with time zone | NO | now() | 作成日時 |
| expires_at | timestamp with time zone | NO | now() + '7 days' | 有効期限 |
| updated_at | timestamp with time zone | NO | now() | 更新日時 |
| max_uses | integer | YES | - | 最大使用回数（NULLの場合は無制限） |
| used_count | integer | NO | 0 | 使用回数 |
| kouden_data | jsonb | YES | - | 香典帳の追加データ（JSON形式） |

## インデックス

```sql
-- 主キーインデックス
CREATE UNIQUE INDEX kouden_invitations_pkey ON public.kouden_invitations USING btree (id);

-- 招待トークンのユニーク制約
CREATE UNIQUE INDEX kouden_invitations_invitation_token_key ON public.kouden_invitations USING btree (invitation_token);

-- 香典帳IDによる検索用インデックス
CREATE INDEX idx_kouden_invitations_kouden_id ON public.kouden_invitations USING btree (kouden_id);

-- 招待トークンによる検索用インデックス
CREATE INDEX idx_kouden_invitations_token ON public.kouden_invitations USING btree (invitation_token);

-- ステータスによる検索用インデックス
CREATE INDEX idx_kouden_invitations_status ON public.kouden_invitations USING btree (status);
```

## 外部キー制約

```sql
-- 作成者の外部キー制約
ALTER TABLE ONLY public.kouden_invitations
    ADD CONSTRAINT kouden_invitations_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id);

-- 香典帳IDの外部キー制約
ALTER TABLE ONLY public.kouden_invitations
    ADD CONSTRAINT kouden_invitations_kouden_id_fkey FOREIGN KEY (kouden_id) REFERENCES public.koudens(id);

-- ロールIDの外部キー制約
ALTER TABLE ONLY public.kouden_invitations
    ADD CONSTRAINT kouden_invitations_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.kouden_roles(id);
```

## RLSポリシー

```sql
-- 所有者のアクセスポリシー
CREATE POLICY owner_invitation_access ON public.kouden_invitations
    FOR ALL
    TO public
    USING (EXISTS (
        SELECT 1
        FROM koudens k
        WHERE k.id = kouden_invitations.kouden_id
        AND k.owner_id = auth.uid()
    ));

-- 招待リンクのアクセスポリシー
CREATE POLICY invitation_link_access ON public.kouden_invitations
    FOR SELECT
    TO public
    USING (
        status = 'pending'::invitation_status
        AND expires_at > now()
        AND (max_uses IS NULL OR used_count < max_uses)
    );
```

## 関連するテーブル

- [koudens](./koudens.md) - 香典帳（kouden_id）
- [profiles](./profiles.md) - ユーザープロフィール（created_by）
- [kouden_roles](./kouden_roles.md) - 香典帳のロール（role_id）
- [kouden_members](./kouden_members.md) - 香典帳のメンバー（invitation_idで参照）

## 備考

- 香典帳への招待情報を管理するテーブルです
- 招待には以下の特徴があります：
  - デフォルトで7日間の有効期限があります
  - 使用回数制限を設定可能です（NULLの場合は無制限）
  - ステータスは`invitation_status`型で管理されます（pending, used, expired等）
  - 招待トークンはユニークで、URLパラメータとして使用されます
- RLSポリシーにより、以下のアクセス制御が実装されています：
  - 香典帳の所有者は全ての操作が可能
  - 有効な招待（期限内、使用回数制限内、pending状態）は誰でも閲覧可能
- 招待時に付与するロールを指定でき、メンバー追加時にそのロールが適用されます
- `kouden_data`フィールドにJSON形式で追加データを保存できます 