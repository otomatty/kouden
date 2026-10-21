# kouden_entry_locks テーブル

香典帳エントリーの同時編集を防ぐためのロック管理テーブルです。

## テーブル定義

```sql
CREATE TABLE public.kouden_entry_locks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    entry_id uuid NOT NULL,
    user_id uuid NOT NULL,
    locked_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone DEFAULT (now() + '00:05:00'::interval) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
```

## カラム

| カラム名 | データ型 | NULL | デフォルト | 説明 |
|---------|----------|------|------------|------|
| id | uuid | NO | gen_random_uuid() | 主キー |
| entry_id | uuid | NO | - | ロック対象の香典帳エントリーID |
| user_id | uuid | NO | - | ロックを取得したユーザーのID |
| locked_at | timestamp with time zone | NO | now() | ロック取得時刻 |
| expires_at | timestamp with time zone | NO | now() + '5 minutes' | ロックの有効期限 |
| created_at | timestamp with time zone | NO | now() | 作成日時 |
| updated_at | timestamp with time zone | NO | now() | 更新日時 |

## インデックス

```sql
-- 主キーインデックス
CREATE UNIQUE INDEX kouden_entry_locks_pkey ON public.kouden_entry_locks USING btree (id);

-- エントリーIDのユニーク制約
CREATE UNIQUE INDEX kouden_entry_locks_entry_id_key ON public.kouden_entry_locks USING btree (entry_id);

-- エントリーIDによる検索用インデックス
CREATE INDEX idx_kouden_entry_locks_entry_id ON public.kouden_entry_locks USING btree (entry_id);

-- ユーザーIDによる検索用インデックス
CREATE INDEX idx_kouden_entry_locks_user_id ON public.kouden_entry_locks USING btree (user_id);

-- 有効期限による検索用インデックス
CREATE INDEX idx_kouden_entry_locks_expires_at ON public.kouden_entry_locks USING btree (expires_at);
```

## 外部キー制約

```sql
-- エントリーIDの外部キー制約
ALTER TABLE ONLY public.kouden_entry_locks
    ADD CONSTRAINT kouden_entry_locks_entry_id_fkey FOREIGN KEY (entry_id) REFERENCES public.kouden_entries(id) ON DELETE CASCADE;

-- ユーザーIDの外部キー制約
ALTER TABLE ONLY public.kouden_entry_locks
    ADD CONSTRAINT kouden_entry_locks_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
```

## RLSポリシー

```sql
-- ユーザーによるロック解除ポリシー
CREATE POLICY "ユーザーは自分のロックを削除できる" ON public.kouden_entry_locks
    FOR DELETE
    TO public
    USING (user_id = auth.uid());
```

## 関連するテーブル

- [kouden_entries](./kouden_entries.md) - 香典帳エントリー（entry_id）
- [users](./users.md) - ユーザー（user_id）

## 備考

- 香典帳エントリーの同時編集を防ぐための排他制御を管理するテーブルです
- 以下の特徴があります：
  - 1つのエントリーに対して1つのロックのみ許可（ユニーク制約）
  - ロックは5分後に自動的に期限切れ（expires_at）
  - ユーザーは自分が取得したロックのみ解除可能
  - エントリーが削除された場合、関連するロックも自動的に削除（ON DELETE CASCADE）
- 有効期限によるインデックスが設定されており、期限切れのロックの検出が効率的に行えます
- ロックの取得と解放は適切なトランザクション制御のもとで行う必要があります 