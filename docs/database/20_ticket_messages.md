# ticket_messages テーブル

サポートチケットに関連するメッセージを管理するテーブルです。

## テーブル定義

```sql
CREATE TABLE public.ticket_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ticket_id uuid NOT NULL,
    content text NOT NULL,
    is_admin_reply boolean DEFAULT false NOT NULL,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);
```

## カラム

| カラム名 | データ型 | NULL | デフォルト | 説明 |
|---------|----------|------|------------|------|
| id | uuid | NO | gen_random_uuid() | 主キー |
| ticket_id | uuid | NO | - | サポートチケットのID |
| content | text | NO | - | メッセージ内容 |
| is_admin_reply | boolean | NO | false | 管理者からの返信かどうか |
| created_by | uuid | NO | - | 作成者のユーザーID |
| created_at | timestamp with time zone | YES | now() | 作成日時 |

## インデックス

```sql
-- 主キーインデックス
CREATE UNIQUE INDEX ticket_messages_pkey ON public.ticket_messages USING btree (id);
```

## 外部キー制約

```sql
-- サポートチケットIDの外部キー制約
ALTER TABLE ONLY public.ticket_messages
    ADD CONSTRAINT ticket_messages_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.support_tickets(id);

-- 作成者の外部キー制約
ALTER TABLE ONLY public.ticket_messages
    ADD CONSTRAINT ticket_messages_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);
```

## RLSポリシー

```sql
-- 管理者の全操作許可ポリシー
CREATE POLICY "管理者は全ての操作が可能" ON public.ticket_messages
    FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1
        FROM admin_users
        WHERE admin_users.user_id = auth.uid()
    ));

-- ユーザーの閲覧ポリシー
CREATE POLICY "ユーザーは自分のチケットのメッセージのみ閲覧可能" ON public.ticket_messages
    FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1
        FROM support_tickets
        WHERE support_tickets.id = ticket_messages.ticket_id
        AND support_tickets.user_id = auth.uid()
    ));

-- ユーザーの追加ポリシー
CREATE POLICY "ユーザーは自分のチケットにのみメッセージを追加可能" ON public.ticket_messages
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM support_tickets
            WHERE support_tickets.id = ticket_messages.ticket_id
            AND support_tickets.user_id = auth.uid()
        )
        AND NOT is_admin_reply
    );
```

## 関連するテーブル

- [support_tickets](./support_tickets.md) - サポートチケット（ticket_id）
- [users](./users.md) - ユーザー（created_by）
- [admin_users](./admin_users.md) - 管理者ユーザー（アクセス制御に使用）

## 備考

- サポートチケットに関連するメッセージを管理するテーブルです
- 以下の特徴があります：
  - チケットに対するメッセージ内容を記録
  - 管理者からの返信かどうかを区別（is_admin_reply）
  - 作成者と作成日時を記録
- RLSポリシーにより、以下のアクセス制御が実装されています：
  - 管理者は全てのメッセージに対して全ての操作が可能
  - 一般ユーザーは自分のチケットに関連するメッセージのみ閲覧可能
  - 一般ユーザーは自分のチケットにのみメッセージを追加可能（ただし管理者返信としては追加不可） 