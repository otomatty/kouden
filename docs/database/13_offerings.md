# offerings テーブル

香典帳に関連するお供え物の情報を管理するテーブルです。

## テーブル定義

```sql
CREATE TABLE public.offerings (
    id uuid DEFAULT uuid_generate_v4() NOT NULL,
    kouden_id uuid NOT NULL,
    type text NOT NULL,
    description text,
    quantity integer DEFAULT 1 NOT NULL,
    price integer,
    provider_name text NOT NULL,
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
| kouden_id | uuid | NO | - | 香典帳のID |
| type | text | NO | - | お供え物の種類 |
| description | text | YES | - | お供え物の説明 |
| quantity | integer | NO | 1 | 数量 |
| price | integer | YES | - | 価格 |
| provider_name | text | NO | - | 提供者名 |
| notes | text | YES | - | 備考 |
| created_at | timestamp with time zone | NO | timezone('utc'::text, now()) | 作成日時 |
| updated_at | timestamp with time zone | NO | timezone('utc'::text, now()) | 更新日時 |
| created_by | uuid | NO | - | 作成者のユーザーID |

## インデックス

```sql
-- 主キーインデックス
CREATE UNIQUE INDEX offerings_pkey ON public.offerings USING btree (id);

-- 作成者による検索用インデックス
CREATE INDEX idx_offerings_created_by ON public.offerings USING btree (created_by);

-- 香典帳IDによる検索用インデックス
CREATE INDEX idx_offerings_kouden_id ON public.offerings USING btree (kouden_id);
```

## 外部キー制約

```sql
-- 香典帳IDの外部キー制約
ALTER TABLE ONLY public.offerings
    ADD CONSTRAINT offerings_kouden_id_fkey FOREIGN KEY (kouden_id) REFERENCES public.koudens(id);

-- 作成者の外部キー制約
ALTER TABLE ONLY public.offerings
    ADD CONSTRAINT offerings_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);
```

## RLSポリシー

```sql
-- 閲覧者の読み取りポリシー
CREATE POLICY "viewer_read_access" ON public.offerings
    FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1
        FROM koudens k
        LEFT JOIN kouden_members m ON k.id = m.kouden_id
        LEFT JOIN kouden_roles r ON m.role_id = r.id
        WHERE k.id = offerings.kouden_id
        AND (
            k.owner_id = auth.uid()
            OR k.created_by = auth.uid()
            OR (
                m.user_id = auth.uid()
                AND (
                    r.name = 'viewer'
                    OR r.name = 'editor'
                    OR 'entry.read' = ANY(r.permissions)
                )
            )
        )
    ));

-- 編集者のCRUDポリシー
CREATE POLICY "editor_crud_access" ON public.offerings
    FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1
        FROM koudens k
        LEFT JOIN kouden_members m ON k.id = m.kouden_id
        LEFT JOIN kouden_roles r ON m.role_id = r.id
        WHERE k.id = offerings.kouden_id
        AND (
            k.owner_id = auth.uid()
            OR k.created_by = auth.uid()
            OR offerings.created_by = auth.uid()
            OR (
                m.user_id = auth.uid()
                AND (
                    r.name = 'editor'
                    OR 'entry.write' = ANY(r.permissions)
                )
            )
        )
    ))
    WITH CHECK (EXISTS (
        SELECT 1
        FROM koudens k
        LEFT JOIN kouden_members m ON k.id = m.kouden_id
        LEFT JOIN kouden_roles r ON m.role_id = r.id
        WHERE k.id = offerings.kouden_id
        AND (
            k.owner_id = auth.uid()
            OR k.created_by = auth.uid()
            OR (
                m.user_id = auth.uid()
                AND (
                    r.name = 'editor'
                    OR 'entry.write' = ANY(r.permissions)
                )
            )
        )
    ));
```

## 関連するテーブル

- [koudens](./koudens.md) - 香典帳（kouden_id）
- [users](./users.md) - ユーザー（created_by）
- [offering_entries](./offering_entries.md) - お供え物と香典帳エントリーの関連付け
- [kouden_members](./kouden_members.md) - 香典帳メンバー（アクセス制御に使用）
- [kouden_roles](./kouden_roles.md) - メンバーロール（アクセス制御に使用）

## 備考

- お供え物の基本情報を管理するテーブルです
- 以下の特徴があります：
  - お供え物の種類、説明、数量、価格、提供者名などの情報を記録
  - 香典帳との関連付けにより、特定の香典帳に紐づくお供え物を管理
  - 作成者と更新日時を記録し、変更履歴を追跡可能
- RLSポリシーにより、以下のアクセス制御が実装されています：
  - 香典帳の所有者、作成者、および閲覧権限を持つメンバーは閲覧が可能
  - 香典帳の所有者、作成者、お供え物の作成者、および編集権限を持つメンバーは編集が可能
  - 編集権限を持つメンバーは新規作成、更新、削除が可能 