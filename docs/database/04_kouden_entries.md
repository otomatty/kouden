# kouden_entries テーブル

香典帳の各エントリー（香典や供物の記録）を管理するテーブルです。

## テーブル定義

```sql
CREATE TABLE public.kouden_entries (
    id uuid DEFAULT uuid_generate_v4() NOT NULL,
    kouden_id uuid NOT NULL,
    name text,
    organization text,
    position text,
    amount integer NOT NULL,
    postal_code text,
    address text,
    phone_number text,
    relationship_id uuid,
    attendance_type text NOT NULL,
    has_offering boolean DEFAULT false NOT NULL,
    is_return_completed boolean DEFAULT false NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by uuid NOT NULL,
    version integer DEFAULT 1,
    last_modified_at timestamp with time zone DEFAULT now(),
    last_modified_by uuid
);
```

## カラム

| カラム名 | データ型 | NULL | デフォルト | 説明 |
|---------|----------|------|------------|------|
| id | uuid | NO | uuid_generate_v4() | 主キー |
| kouden_id | uuid | NO | - | 所属する香典帳のID |
| name | text | YES | - | ご芳名(任意) |
| organization | text | YES | - | 所属組織名 |
| position | text | YES | - | 役職 |
| amount | integer | NO | - | 香典金額 |
| postal_code | text | YES | - | 郵便番号 |
| address | text | YES | - | 住所（任意） |
| phone_number | text | YES | - | 電話番号 |
| relationship_id | uuid | YES | - | 関係性ID |
| attendance_type | text | NO | - | 参列種別 |
| has_offering | boolean | NO | false | お供え物の有無 |
| is_return_completed | boolean | NO | false | 返礼完了フラグ |
| notes | text | YES | - | 備考 |
| created_at | timestamp with time zone | NO | timezone('utc'::text, now()) | 作成日時 |
| updated_at | timestamp with time zone | NO | timezone('utc'::text, now()) | 更新日時 |
| created_by | uuid | NO | - | 作成者のユーザーID |
| version | integer | YES | 1 | バージョン番号 |
| last_modified_at | timestamp with time zone | YES | now() | 最終更新日時 |
| last_modified_by | uuid | YES | - | 最終更新者のユーザーID |

## インデックス

```sql
-- 主キーインデックス
CREATE UNIQUE INDEX kouden_entries_pkey ON public.kouden_entries USING btree (id);

-- 香典帳IDによる検索用インデックス
CREATE INDEX idx_kouden_entries_kouden_id ON public.kouden_entries USING btree (kouden_id);

-- 作成者による検索用インデックス
CREATE INDEX idx_kouden_entries_created_by ON public.kouden_entries USING btree (created_by);

-- 関係性IDによる検索用インデックス
CREATE INDEX idx_kouden_entries_relationship_id ON public.kouden_entries USING btree (relationship_id);
```

## 外部キー制約

```sql
-- 作成者の外部キー制約
ALTER TABLE ONLY public.kouden_entries
    ADD CONSTRAINT kouden_entries_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);

-- 香典帳IDの外部キー制約
ALTER TABLE ONLY public.kouden_entries
    ADD CONSTRAINT kouden_entries_kouden_id_fkey FOREIGN KEY (kouden_id) REFERENCES public.koudens(id);

-- 最終更新者の外部キー制約
ALTER TABLE ONLY public.kouden_entries
    ADD CONSTRAINT kouden_entries_last_modified_by_fkey FOREIGN KEY (last_modified_by) REFERENCES auth.users(id);
```

## RLSポリシー

```sql
-- 所有者のCRUDアクセスポリシー
CREATE POLICY owner_crud_access ON public.kouden_entries
    FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1
        FROM koudens k
        WHERE k.id = kouden_entries.kouden_id
        AND (k.owner_id = auth.uid() OR k.created_by = auth.uid())
    ))
    WITH CHECK (EXISTS (
        SELECT 1
        FROM koudens k
        WHERE k.id = kouden_entries.kouden_id
        AND (k.owner_id = auth.uid() OR k.created_by = auth.uid())
    ));

-- 編集者のCRUDアクセスポリシー
CREATE POLICY editor_crud_access ON public.kouden_entries
    FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1
        FROM kouden_members m
        JOIN kouden_roles r ON m.role_id = r.id
        WHERE m.kouden_id = kouden_entries.kouden_id
        AND m.user_id = auth.uid()
        AND (r.name = 'editor' OR 'entry.write' = ANY(r.permissions))
    ))
    WITH CHECK (EXISTS (
        SELECT 1
        FROM kouden_members m
        JOIN kouden_roles r ON m.role_id = r.id
        WHERE m.kouden_id = kouden_entries.kouden_id
        AND m.user_id = auth.uid()
        AND (r.name = 'editor' OR 'entry.write' = ANY(r.permissions))
    ));

-- 閲覧者の読み取りアクセスポリシー
CREATE POLICY viewer_read_access ON public.kouden_entries
    FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1
        FROM kouden_members m
        JOIN kouden_roles r ON m.role_id = r.id
        WHERE m.kouden_id = kouden_entries.kouden_id
        AND m.user_id = auth.uid()
        AND (r.name = 'viewer' OR 'entry.read' = ANY(r.permissions))
    ));
```

## 関連するテーブル

- [koudens](./koudens.md) - 香典帳（kouden_id）
- [users](./users.md) - ユーザー（created_by, last_modified_by）
- [relationships](./relationships.md) - 関係性（relationship_id）
- [offerings](./offerings.md) - お供え物
- [return_items](./return_items.md) - 返礼品

## 備考

- 香典帳の各エントリーを管理する中心的なテーブルです
- バージョン管理機能があり、`version`カラムで変更履歴を追跡できます
- RLSポリシーにより、以下のアクセス制御が実装されています：
  - 香典帳の所有者は全ての操作が可能
  - 編集者権限を持つメンバーは全ての操作が可能
  - 閲覧者権限を持つメンバーは読み取りのみ可能
- お供え物の有無と返礼の完了状態を管理するフラグがあります
- 最終更新情報（日時、更新者）を記録しています 