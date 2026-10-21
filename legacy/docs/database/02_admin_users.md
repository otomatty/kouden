# admin_users テーブル

管理者ユーザーを管理するテーブルです。

## テーブル定義

```sql
CREATE TABLE public.admin_users (
    id uuid DEFAULT uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    role character varying(50) DEFAULT 'admin'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
```

## カラム

| カラム名 | データ型 | NULL | デフォルト | 説明 |
|---------|----------|------|------------|------|
| id | uuid | NO | uuid_generate_v4() | 主キー |
| user_id | uuid | NO | - | ユーザーID |
| role | character varying(50) | NO | 'admin' | 管理者ロール（'admin'または'super_admin'） |
| created_at | timestamp with time zone | YES | now() | 作成日時 |
| updated_at | timestamp with time zone | YES | now() | 更新日時 |

## インデックス

```sql
-- 主キーインデックス
CREATE UNIQUE INDEX admin_users_pkey ON public.admin_users USING btree (id);

-- ユーザーIDのユニーク制約
CREATE UNIQUE INDEX unique_admin_user ON public.admin_users USING btree (user_id);
```

## 外部キー制約

```sql
-- ユーザーIDの外部キー制約
ALTER TABLE ONLY public.admin_users
    ADD CONSTRAINT admin_users_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
```

## RLSポリシー

```sql
-- 管理者の閲覧ポリシー
CREATE POLICY "Admins can view admin_users" ON public.admin_users
    FOR SELECT
    TO authenticated
    USING (is_admin(auth.uid()));

-- スーパー管理者の追加ポリシー
CREATE POLICY "Super admins can insert admin_users" ON public.admin_users
    FOR INSERT
    TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1
        FROM admin_users admin_users_1
        WHERE admin_users_1.user_id = auth.uid()
        AND admin_users_1.role::text = 'super_admin'::text
    ));

-- スーパー管理者の更新ポリシー
CREATE POLICY "Super admins can update admin_users" ON public.admin_users
    FOR UPDATE
    TO authenticated
    USING (EXISTS (
        SELECT 1
        FROM admin_users admin_users_1
        WHERE admin_users_1.user_id = auth.uid()
        AND admin_users_1.role::text = 'super_admin'::text
    ));

-- スーパー管理者の削除ポリシー
CREATE POLICY "Super admins can delete admin_users" ON public.admin_users
    FOR DELETE
    TO authenticated
    USING (EXISTS (
        SELECT 1
        FROM admin_users admin_users_1
        WHERE admin_users_1.user_id = auth.uid()
        AND admin_users_1.role::text = 'super_admin'::text
    ));
```

## 関連するテーブル

- [users](./users.md) - ユーザー（user_id）
- [support_tickets](./support_tickets.md) - サポートチケット（アクセス制御に使用）
- [ticket_messages](./ticket_messages.md) - チケットメッセージ（アクセス制御に使用）

## 備考

- 管理者ユーザーを管理するテーブルです
- 以下の特徴があります：
  - 管理者ロールは'admin'と'super_admin'の2種類
  - 1人のユーザーは1つの管理者ロールのみ保持可能（ユニーク制約）
  - 作成日時と更新日時を記録
- RLSポリシーにより、以下のアクセス制御が実装されています：
  - 管理者は管理者一覧の閲覧が可能
  - スーパー管理者のみが管理者の追加・更新・削除が可能
  - 一般ユーザーはアクセス不可 