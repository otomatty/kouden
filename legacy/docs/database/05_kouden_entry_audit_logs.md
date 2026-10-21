# kouden_entry_audit_logs テーブル

香典帳エントリーの変更履歴を管理するテーブルです。

## テーブル定義

```sql
CREATE TABLE public.kouden_entry_audit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    entry_id uuid NOT NULL,
    user_id uuid NOT NULL,
    action text NOT NULL,
    changes jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
```

## カラム

| カラム名 | データ型 | NULL | デフォルト | 説明 |
|---------|----------|------|------------|------|
| id | uuid | NO | gen_random_uuid() | 主キー |
| entry_id | uuid | NO | - | 変更対象の香典帳エントリーID |
| user_id | uuid | NO | - | 変更を行ったユーザーのID |
| action | text | NO | - | 実行されたアクション（create/update/delete） |
| changes | jsonb | YES | - | 変更内容（JSON形式） |
| created_at | timestamp with time zone | NO | now() | 作成日時 |

## インデックス

```sql
-- 主キーインデックス
CREATE UNIQUE INDEX kouden_entry_audit_logs_pkey ON public.kouden_entry_audit_logs USING btree (id);

-- エントリーIDによる検索用インデックス
CREATE INDEX idx_kouden_entry_audit_logs_entry_id ON public.kouden_entry_audit_logs USING btree (entry_id);

-- ユーザーIDによる検索用インデックス
CREATE INDEX idx_kouden_entry_audit_logs_user_id ON public.kouden_entry_audit_logs USING btree (user_id);

-- 作成日時による検索用インデックス
CREATE INDEX idx_kouden_entry_audit_logs_created_at ON public.kouden_entry_audit_logs USING btree (created_at);
```

## 外部キー制約

```sql
-- エントリーIDの外部キー制約
ALTER TABLE ONLY public.kouden_entry_audit_logs
    ADD CONSTRAINT kouden_entry_audit_logs_entry_id_fkey FOREIGN KEY (entry_id) REFERENCES public.kouden_entries(id) ON DELETE CASCADE;

-- ユーザーIDの外部キー制約
ALTER TABLE ONLY public.kouden_entry_audit_logs
    ADD CONSTRAINT kouden_entry_audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
```

## RLSポリシー

```sql
-- システムによる監査ログ作成ポリシー
CREATE POLICY "システムは監査ログを作成できる" ON public.kouden_entry_audit_logs
    FOR INSERT
    TO public
    WITH CHECK (true);
```

## 関連するテーブル

- [kouden_entries](./kouden_entries.md) - 香典帳エントリー（entry_id）
- [users](./users.md) - ユーザー（user_id）

## 備考

- 香典帳エントリーの変更履歴を記録するための監査ログテーブルです
- 以下の情報が記録されます：
  - 変更対象のエントリー
  - 変更を行ったユーザー
  - 実行されたアクション（作成/更新/削除）
  - 変更内容の詳細（JSON形式）
  - 変更が行われた日時
- エントリーが削除された場合、関連する監査ログも自動的に削除されます（ON DELETE CASCADE）
- 監査ログの作成は誰でも可能ですが、これはシステムによる自動記録を想定しています
- 作成日時にインデックスが設定されており、時系列での検索が効率的に行えます 