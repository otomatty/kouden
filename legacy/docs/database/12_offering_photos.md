# offering_photos テーブル

お供え物の写真情報を管理するテーブルです。

## テーブル定義

```sql
CREATE TABLE public.offering_photos (
    id uuid DEFAULT uuid_generate_v4() NOT NULL,
    offering_id uuid NOT NULL,
    storage_key text NOT NULL,
    caption text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by uuid NOT NULL
);
```

## カラム

| カラム名 | データ型 | NULL | デフォルト | 説明 |
|---------|----------|------|------------|------|
| id | uuid | NO | uuid_generate_v4() | 主キー |
| offering_id | uuid | NO | - | 関連するお供え物のID |
| storage_key | text | NO | - | ストレージ内の写真のキー |
| caption | text | YES | - | 写真の説明文 |
| created_at | timestamp with time zone | NO | timezone('utc'::text, now()) | 作成日時 |
| updated_at | timestamp with time zone | NO | timezone('utc'::text, now()) | 更新日時 |
| created_by | uuid | NO | - | 作成者のユーザーID |

## インデックス

```sql
-- 主キーインデックス
CREATE UNIQUE INDEX offering_photos_pkey ON public.offering_photos USING btree (id);

-- お供え物IDによる検索用インデックス
CREATE INDEX idx_offering_photos_offering_id ON public.offering_photos USING btree (offering_id);
```

## 外部キー制約

```sql
-- 作成者の外部キー制約
ALTER TABLE ONLY public.offering_photos
    ADD CONSTRAINT offering_photos_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);

-- お供え物IDの外部キー制約
ALTER TABLE ONLY public.offering_photos
    ADD CONSTRAINT offering_photos_offering_id_fkey FOREIGN KEY (offering_id) REFERENCES public.offerings(id);
```

## RLSポリシー

```sql
-- 閲覧者の読み取りアクセスポリシー
CREATE POLICY viewer_read_access ON public.offering_photos
    FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1
        FROM offerings o
        JOIN koudens k ON o.kouden_id = k.id
        LEFT JOIN kouden_members m ON k.id = m.kouden_id
        LEFT JOIN kouden_roles r ON m.role_id = r.id
        WHERE o.id = offering_photos.offering_id
        AND (
            k.owner_id = auth.uid()
            OR k.created_by = auth.uid()
            OR o.created_by = auth.uid()
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

-- 編集者のCRUDアクセスポリシー
CREATE POLICY editor_crud_access ON public.offering_photos
    FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1
        FROM offerings o
        JOIN koudens k ON o.kouden_id = k.id
        LEFT JOIN kouden_members m ON k.id = m.kouden_id
        LEFT JOIN kouden_roles r ON m.role_id = r.id
        WHERE o.id = offering_photos.offering_id
        AND (
            k.owner_id = auth.uid()
            OR k.created_by = auth.uid()
            OR o.created_by = auth.uid()
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
        FROM offerings o
        JOIN koudens k ON o.kouden_id = k.id
        LEFT JOIN kouden_members m ON k.id = m.kouden_id
        LEFT JOIN kouden_roles r ON m.role_id = r.id
        WHERE o.id = offering_photos.offering_id
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

- [offerings](./offerings.md) - お供え物（offering_id）
- [users](./users.md) - ユーザー（created_by）
- [koudens](./koudens.md) - 香典帳（間接的な関連）

## 備考

- お供え物の写真情報を管理するテーブルです
- 写真の実体はストレージに保存され、`storage_key`で参照します
- キャプション（説明文）は任意（NULL許容）です
- RLSポリシーにより、以下のアクセス制御が実装されています：
  - 香典帳の所有者は全ての操作が可能
  - 香典帳の作成者は全ての操作が可能
  - お供え物の作成者は全ての操作が可能
  - 編集者権限を持つメンバーは全ての操作が可能
  - 閲覧者権限を持つメンバーは読み取りのみ可能 