# kouden_roles テーブル

香典帳のメンバーのロールと権限を管理するテーブルです。

## テーブル定義

```sql
CREATE TABLE public.kouden_roles (
    id uuid DEFAULT uuid_generate_v4() NOT NULL,
    kouden_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    permissions text[] NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by uuid NOT NULL
);
```

## カラム

| カラム名 | データ型 | NULL | デフォルト | 説明 |
|---------|----------|------|------------|------|
| id | uuid | NO | uuid_generate_v4() | 主キー |
| kouden_id | uuid | NO | - | 所属する香典帳のID |
| name | text | NO | - | ロール名 |
| description | text | YES | - | ロールの説明 |
| permissions | text[] | NO | - | 権限の配列 |
| created_at | timestamp with time zone | NO | timezone('utc'::text, now()) | 作成日時 |
| updated_at | timestamp with time zone | NO | timezone('utc'::text, now()) | 更新日時 |
| created_by | uuid | NO | - | 作成者のユーザーID |

## インデックス

```sql
-- 主キーインデックス
CREATE UNIQUE INDEX kouden_roles_pkey ON public.kouden_roles USING btree (id);

-- 香典帳とロール名の組み合わせのユニーク制約
CREATE UNIQUE INDEX kouden_roles_kouden_id_name_key ON public.kouden_roles USING btree (kouden_id, name);

-- 香典帳IDによる検索用インデックス
CREATE INDEX idx_kouden_roles_kouden_id ON public.kouden_roles USING btree (kouden_id);
```

## 外部キー制約

```sql
-- 作成者の外部キー制約
ALTER TABLE ONLY public.kouden_roles
    ADD CONSTRAINT kouden_roles_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);

-- 香典帳IDの外部キー制約
ALTER TABLE ONLY public.kouden_roles
    ADD CONSTRAINT kouden_roles_kouden_id_fkey FOREIGN KEY (kouden_id) REFERENCES public.koudens(id);
```

## RLSポリシー

```sql
-- 香典帳所有者のアクセスポリシー
CREATE POLICY kouden_roles_simple_access ON public.kouden_roles
    FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1
        FROM koudens
        WHERE koudens.id = kouden_roles.kouden_id
        AND koudens.owner_id = auth.uid()
    ));

-- メンバーの閲覧アクセスポリシー
CREATE POLICY kouden_roles_member_access ON public.kouden_roles
    FOR SELECT
    TO authenticated
    USING (id IN (
        SELECT kouden_members.role_id
        FROM kouden_members
        WHERE kouden_members.user_id = auth.uid()
    ));
```

## 関連するテーブル

- [koudens](./koudens.md) - 香典帳（kouden_id）
- [users](./users.md) - ユーザー（created_by）
- [kouden_members](./kouden_members.md) - 香典帳のメンバー（role_id）

## 備考

- 香典帳のロールと権限を管理するテーブルです
- 同一香典帳内で同じ名前のロールは作成できません（ユニーク制約）
- 権限は配列として保存され、複数の権限を1つのロールに割り当てることができます
- RLSポリシーにより、以下のアクセス制御が実装されています：
  - 香典帳の所有者は全ての操作が可能
  - メンバーは自分に割り当てられたロールの情報を閲覧可能
- 一般的なロールには以下のようなものがあります：
  - editor: 編集者権限
  - viewer: 閲覧者権限
- 権限には以下のようなものがあります：
  - entry.read: エントリーの閲覧権限
  - entry.write: エントリーの編集権限 