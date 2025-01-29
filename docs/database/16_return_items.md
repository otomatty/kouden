# return_items テーブル

香典帳の返礼品情報を管理するテーブルです。

## テーブル定義

```sql
CREATE TABLE public.return_items (
    id uuid DEFAULT uuid_generate_v4() NOT NULL,
    kouden_entry_id uuid NOT NULL,
    name text NOT NULL,
    price integer NOT NULL,
    delivery_method text NOT NULL,
    sent_date date,
    notes text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by uuid NOT NULL
);
```

## カラム

| カラム名 | データ型 | NULL | デフォルト | 説明 |
|---------|----------|------|------------|------|
| id | uuid | NO | uuid_generate_v4() | 主キー |
| kouden_entry_id | uuid | NO | - | 関連する香典帳エントリーのID |
| name | text | NO | - | 返礼品の名称 |
| price | integer | NO | - | 返礼品の価格 |
| delivery_method | text | NO | - | 配送方法 |
| sent_date | date | YES | - | 発送日 |
| notes | text | YES | - | 備考 |
| created_at | timestamp with time zone | NO | timezone('utc'::text, now()) | 作成日時 |
| updated_at | timestamp with time zone | NO | timezone('utc'::text, now()) | 更新日時 |
| created_by | uuid | NO | - | 作成者のユーザーID |

## インデックス

```sql
-- 主キーインデックス
CREATE UNIQUE INDEX return_items_pkey ON public.return_items USING btree (id);

-- 香典帳エントリーIDによる検索用インデックス
CREATE INDEX idx_return_items_kouden_entry_id ON public.return_items USING btree (kouden_entry_id);
```

## 外部キー制約

```sql
-- 作成者の外部キー制約
ALTER TABLE ONLY public.return_items
    ADD CONSTRAINT return_items_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);

-- 香典帳エントリーIDの外部キー制約
ALTER TABLE ONLY public.return_items
    ADD CONSTRAINT return_items_kouden_entry_id_fkey FOREIGN KEY (kouden_entry_id) REFERENCES public.kouden_entries(id);
```

## RLSポリシー

```sql
-- 返礼品の閲覧ポリシー
CREATE POLICY "Users can view return_items of their koudens" ON public.return_items
    FOR SELECT
    TO public
    USING (EXISTS (
        SELECT 1
        FROM kouden_entries
        JOIN koudens ON koudens.id = kouden_entries.kouden_id
        WHERE kouden_entries.id = return_items.kouden_entry_id
        AND koudens.owner_id = auth.uid()
    ));

-- 返礼品の追加ポリシー
CREATE POLICY "Users can insert return_items to their koudens" ON public.return_items
    FOR INSERT
    TO public
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM kouden_entries
            JOIN koudens ON koudens.id = kouden_entries.kouden_id
            WHERE kouden_entries.id = return_items.kouden_entry_id
            AND koudens.owner_id = auth.uid()
        )
        AND auth.uid() = created_by
    );

-- 返礼品の更新ポリシー
CREATE POLICY "Users can update return_items of their koudens" ON public.return_items
    FOR UPDATE
    TO public
    USING (EXISTS (
        SELECT 1
        FROM kouden_entries
        JOIN koudens ON koudens.id = kouden_entries.kouden_id
        WHERE kouden_entries.id = return_items.kouden_entry_id
        AND koudens.owner_id = auth.uid()
    ))
    WITH CHECK (EXISTS (
        SELECT 1
        FROM kouden_entries
        JOIN koudens ON koudens.id = kouden_entries.kouden_id
        WHERE kouden_entries.id = return_items.kouden_entry_id
        AND koudens.owner_id = auth.uid()
    ));

-- 返礼品の削除ポリシー
CREATE POLICY "Users can delete return_items of their koudens" ON public.return_items
    FOR DELETE
    TO public
    USING (EXISTS (
        SELECT 1
        FROM kouden_entries
        JOIN koudens ON koudens.id = kouden_entries.kouden_id
        WHERE kouden_entries.id = return_items.kouden_entry_id
        AND koudens.owner_id = auth.uid()
    ));
```

## 関連するテーブル

- [kouden_entries](./kouden_entries.md) - 香典帳エントリー（kouden_entry_id）
- [users](./users.md) - ユーザー（created_by）
- [koudens](./koudens.md) - 香典帳（間接的な関連）

## 備考

- 香典帳の返礼品情報を管理するテーブルです
- 返礼品は特定の香典帳エントリーに紐づけられます
- 発送日は任意（NULL許容）で記録できます
- RLSポリシーにより、以下のアクセス制御が実装されています：
  - 香典帳の所有者のみが返礼品の閲覧、追加、更新、削除が可能
  - 返礼品の追加時は作成者が本人であることも確認されます
- 配送方法や備考欄を活用して、返礼品の管理を詳細に行うことができます 