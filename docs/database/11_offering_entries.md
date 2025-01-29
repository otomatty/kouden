# offering_entries テーブル

香典帳エントリーとお供え物の関連付けを管理する中間テーブルです。

## テーブル定義

```sql
CREATE TABLE public.offering_entries (
    id uuid DEFAULT uuid_generate_v4() NOT NULL,
    offering_id uuid NOT NULL,
    kouden_entry_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by uuid NOT NULL
);
```

## カラム

| カラム名 | データ型 | NULL | デフォルト | 説明 |
|---------|----------|------|------------|------|
| id | uuid | NO | uuid_generate_v4() | 主キー |
| offering_id | uuid | NO | - | お供え物のID |
| kouden_entry_id | uuid | NO | - | 香典帳エントリーのID |
| created_at | timestamp with time zone | NO | timezone('utc'::text, now()) | 作成日時 |
| created_by | uuid | NO | - | 作成者のユーザーID |

## インデックス

```sql
-- 主キーインデックス
CREATE UNIQUE INDEX offering_entries_pkey ON public.offering_entries USING btree (id);

-- お供え物IDとエントリーIDの組み合わせユニーク制約
CREATE UNIQUE INDEX offering_entries_offering_id_kouden_entry_id_key ON public.offering_entries USING btree (offering_id, kouden_entry_id);

-- お供え物IDによる検索用インデックス
CREATE INDEX idx_offering_entries_offering_id ON public.offering_entries USING btree (offering_id);

-- エントリーIDによる検索用インデックス
CREATE INDEX idx_offering_entries_kouden_entry_id ON public.offering_entries USING btree (kouden_entry_id);
```

## 外部キー制約

```sql
-- お供え物IDの外部キー制約
ALTER TABLE ONLY public.offering_entries
    ADD CONSTRAINT offering_entries_offering_id_fkey FOREIGN KEY (offering_id) REFERENCES public.offerings(id);

-- エントリーIDの外部キー制約
ALTER TABLE ONLY public.offering_entries
    ADD CONSTRAINT offering_entries_kouden_entry_id_fkey FOREIGN KEY (kouden_entry_id) REFERENCES public.kouden_entries(id);

-- 作成者の外部キー制約
ALTER TABLE ONLY public.offering_entries
    ADD CONSTRAINT offering_entries_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);
```

## RLSポリシー

```sql
-- 閲覧ポリシー
CREATE POLICY "Users can view offering entries" ON public.offering_entries
    FOR SELECT
    TO public
    USING (EXISTS (
        SELECT 1
        FROM kouden_entries ke
        JOIN koudens k ON k.id = ke.kouden_id
        WHERE ke.id = offering_entries.kouden_entry_id
        AND (
            k.owner_id = auth.uid()
            OR EXISTS (
                SELECT 1
                FROM kouden_members m
                JOIN kouden_roles r ON m.role_id = r.id
                WHERE m.kouden_id = k.id
                AND m.user_id = auth.uid()
                AND r.name = ANY(ARRAY['編集者', '閲覧者'])
            )
        )
    ));

-- 編集者の追加ポリシー
CREATE POLICY "editor_insert_access" ON public.offering_entries
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM kouden_entries ke
            JOIN koudens k ON k.id = ke.kouden_id
            JOIN kouden_members m ON m.kouden_id = k.id
            JOIN kouden_roles r ON m.role_id = r.id
            WHERE ke.id = offering_entries.kouden_entry_id
            AND m.user_id = auth.uid()
            AND (r.name = 'editor' OR 'entry.write' = ANY(r.permissions))
        )
        AND auth.uid() = created_by
    );

-- 編集者の削除ポリシー
CREATE POLICY "editor_delete_access" ON public.offering_entries
    FOR DELETE
    TO authenticated
    USING (EXISTS (
        SELECT 1
        FROM kouden_entries ke
        JOIN koudens k ON k.id = ke.kouden_id
        JOIN kouden_members m ON m.kouden_id = k.id
        JOIN kouden_roles r ON m.role_id = r.id
        WHERE ke.id = offering_entries.kouden_entry_id
        AND m.user_id = auth.uid()
        AND (r.name = 'editor' OR 'entry.write' = ANY(r.permissions))
    ));
```

## 関連するテーブル

- [offerings](./offerings.md) - お供え物（offering_id）
- [kouden_entries](./kouden_entries.md) - 香典帳エントリー（kouden_entry_id）
- [users](./users.md) - ユーザー（created_by）
- [koudens](./koudens.md) - 香典帳（間接的な関連）
- [kouden_members](./kouden_members.md) - 香典帳メンバー（アクセス制御に使用）
- [kouden_roles](./kouden_roles.md) - メンバーロール（アクセス制御に使用）

## 備考

- 香典帳エントリーとお供え物の多対多の関連を管理する中間テーブルです
- 以下の特徴があります：
  - 1つのお供え物と1つのエントリーの組み合わせは一意（ユニーク制約）
  - 関連するエントリーやお供え物の検索を効率化するためのインデックスあり
- RLSポリシーにより、以下のアクセス制御が実装されています：
  - 香典帳の所有者とメンバー（編集者・閲覧者）は関連付けの閲覧が可能
  - 編集権限を持つメンバーのみが関連付けの追加・削除が可能
  - 関連付けの追加時は作成者が本人であることも確認 