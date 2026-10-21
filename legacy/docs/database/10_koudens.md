# koudens テーブル

香典帳の基本情報を管理するテーブルです。

## テーブル定義

```sql
CREATE TABLE public.koudens (
    id uuid DEFAULT uuid_generate_v4() NOT NULL,
    title text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by uuid NOT NULL,
    owner_id uuid NOT NULL,
    status text DEFAULT 'active'::text NOT NULL
);
```

## カラム

| カラム名 | データ型 | NULL | デフォルト | 説明 |
|---------|----------|------|------------|------|
| id | uuid | NO | uuid_generate_v4() | 主キー |
| title | text | NO | - | 香典帳のタイトル |
| description | text | YES | - | 香典帳の説明 |
| created_at | timestamp with time zone | NO | timezone('utc'::text, now()) | 作成日時 |
| updated_at | timestamp with time zone | NO | timezone('utc'::text, now()) | 更新日時 |
| created_by | uuid | NO | - | 作成者のプロフィールID |
| owner_id | uuid | NO | - | 所有者のプロフィールID |
| status | text | NO | 'active'::text | 香典帳のステータス |

## インデックス

```sql
-- 主キーインデックス
CREATE UNIQUE INDEX koudens_pkey ON public.koudens USING btree (id);

-- 所有者と作成日時による検索用インデックス
CREATE INDEX idx_koudens_owner_created_at ON public.koudens USING btree (owner_id, created_at DESC);
CREATE INDEX idx_koudens_owner_created ON public.koudens USING btree (owner_id, created_at DESC);

-- 所有者による検索用インデックス
CREATE INDEX idx_koudens_owner_id ON public.koudens USING btree (owner_id);

-- 作成者による検索用インデックス
CREATE INDEX idx_koudens_created_by ON public.koudens USING btree (created_by);
```

## 外部キー制約

```sql
-- 作成者の外部キー制約
ALTER TABLE ONLY public.koudens
    ADD CONSTRAINT koudens_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id);

-- 所有者の外部キー制約
ALTER TABLE ONLY public.koudens
    ADD CONSTRAINT koudens_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.profiles(id);
```

## RLSポリシー

```sql
-- 所有者アクセスポリシー
CREATE POLICY owner_access ON public.koudens
    FOR ALL
    TO authenticated
    USING ((owner_id = auth.uid()) OR (created_by = auth.uid()));

-- 挿入ポリシー
CREATE POLICY koudens_insert_policy ON public.koudens
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() IS NOT NULL);

-- 基本アクセスポリシー（所有者、作成者、メンバー）
CREATE POLICY basic_access ON public.koudens
    FOR ALL
    TO authenticated
    USING ((owner_id = auth.uid()) OR (created_by = auth.uid()) OR (id IN (
        SELECT kouden_members.kouden_id
        FROM kouden_members
        WHERE kouden_members.user_id = auth.uid()
    )));
```

## 関連するテーブル

- [profiles](./profiles.md) - ユーザープロフィール（created_by, owner_id）
- [kouden_entries](./kouden_entries.md) - 香典帳エントリー
- [kouden_members](./kouden_members.md) - 香典帳のメンバー
- [kouden_roles](./kouden_roles.md) - 香典帳のロール
- [kouden_invitations](./kouden_invitations.md) - 香典帳への招待情報

## 備考

- 香典帳の基本情報を管理する中心的なテーブルです
- 香典帳に関連する全ての情報は、このテーブルのレコードを起点として関連付けられます
- RLSポリシーにより、以下のユーザーのみがアクセス可能です：
  - 香典帳の所有者
  - 香典帳の作成者
  - 香典帳のメンバー
- ステータスは'active'がデフォルト値として設定されています 