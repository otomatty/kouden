# support_tickets テーブル

サポートチケットの基本情報を管理するテーブルです。

## テーブル定義

```sql
CREATE TABLE public.support_tickets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    subject text NOT NULL,
    content text NOT NULL,
    status text NOT NULL,
    priority text NOT NULL,
    user_id uuid NOT NULL,
    assigned_to uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    resolved_at timestamp with time zone
);
```

## カラム

| カラム名 | データ型 | NULL | デフォルト | 説明 |
|---------|----------|------|------------|------|
| id | uuid | NO | gen_random_uuid() | 主キー |
| subject | text | NO | - | チケットの件名 |
| content | text | NO | - | チケットの内容 |
| status | text | NO | - | チケットのステータス |
| priority | text | NO | - | チケットの優先度 |
| user_id | uuid | NO | - | チケット作成者のユーザーID |
| assigned_to | uuid | YES | - | 担当者のユーザーID |
| created_at | timestamp with time zone | YES | now() | 作成日時 |
| updated_at | timestamp with time zone | YES | now() | 更新日時 |
| resolved_at | timestamp with time zone | YES | - | 解決日時 |

## インデックス

```sql
-- 主キーインデックス
CREATE UNIQUE INDEX support_tickets_pkey ON public.support_tickets USING btree (id);
```

## 外部キー制約

```sql
-- チケット作成者の外部キー制約
ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);

-- 担当者の外部キー制約
ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES auth.users(id);
```

## RLSポリシー

```sql
-- 管理者の全操作許可ポリシー
CREATE POLICY "管理者は全ての操作が可能" ON public.support_tickets
    FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1
        FROM admin_users
        WHERE admin_users.user_id = auth.uid()
    ));

-- ユーザーの閲覧ポリシー
CREATE POLICY "ユーザーは自分のチケットのみ閲覧可能" ON public.support_tickets
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());
```

## 関連するテーブル

- [users](./users.md) - ユーザー（user_id, assigned_to）
- [admin_users](./admin_users.md) - 管理者ユーザー（アクセス制御に使用）
- [ticket_messages](./ticket_messages.md) - チケットメッセージ

## 備考

- サポートチケットの基本情報を管理するテーブルです
- 以下の特徴があります：
  - チケットの件名、内容、ステータス、優先度を記録
  - チケット作成者と担当者（任意）を管理
  - 作成日時、更新日時、解決日時を追跡
- RLSポリシーにより、以下のアクセス制御が実装されています：
  - 管理者は全てのチケットに対して全ての操作が可能
  - 一般ユーザーは自分が作成したチケットのみ閲覧可能
  - チケットの作成、更新、削除は管理者のみ可能 