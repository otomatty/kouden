# relationships テーブル

香典帳における故人との関係性を管理するテーブルです。

## テーブル定義

```sql
CREATE TABLE public.relationships (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    kouden_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    is_default boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid NOT NULL
);
```

## カラム

| カラム名 | データ型 | NULL | デフォルト | 説明 |
|---------|----------|------|------------|------|
| id | uuid | NO | gen_random_uuid() | 主キー |
| kouden_id | uuid | NO | - | 所属する香典帳のID |
| name | text | NO | - | 関係性の名称 |
| description | text | YES | - | 関係性の説明 |
| is_default | boolean | NO | false | デフォルトの関係性かどうか |
| created_at | timestamp with time zone | NO | now() | 作成日時 |
| updated_at | timestamp with time zone | NO | now() | 更新日時 |
| created_by | uuid | NO | - | 作成者のユーザーID |

## インデックス

```sql
-- 主キーインデックス
CREATE UNIQUE INDEX relationships_pkey ON public.relationships USING btree (id);

-- 香典帳IDと名称の組み合わせユニーク制約
CREATE UNIQUE INDEX relationships_kouden_id_name_key ON public.relationships USING btree (kouden_id, name);
```

## 外部キー制約

```sql
-- 作成者の外部キー制約
ALTER TABLE ONLY public.relationships
    ADD CONSTRAINT relationships_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);

-- 香典帳IDの外部キー制約
ALTER TABLE ONLY public.relationships
    ADD CONSTRAINT relationships_kouden_id_fkey FOREIGN KEY (kouden_id) REFERENCES public.koudens(id);
```

## RLSポリシー

```sql
-- メンバーの閲覧ポリシー
CREATE POLICY "enable_select_for_members" ON public.relationships
    FOR SELECT
    TO public
    USING (EXISTS (
        SELECT 1
        FROM koudens k
        JOIN kouden_members km ON k.id = km.kouden_id
        JOIN kouden_roles kr ON km.role_id = kr.id
        WHERE k.id = relationships.kouden_id
        AND km.user_id = auth.uid()
        AND 'view' = ANY(kr.permissions)
    ));

-- 権限のあるメンバーの追加ポリシー
CREATE POLICY "enable_insert_for_authorized_members" ON public.relationships
    FOR INSERT
    TO public
    WITH CHECK (EXISTS (
        SELECT 1
        FROM koudens k
        JOIN kouden_members km ON k.id = km.kouden_id
        JOIN kouden_roles kr ON km.role_id = kr.id
        WHERE k.id = relationships.kouden_id
        AND km.user_id = auth.uid()
        AND 'edit' = ANY(kr.permissions)
    ));

-- 権限のあるメンバーの更新ポリシー（デフォルト以外）
CREATE POLICY "enable_update_for_authorized_members" ON public.relationships
    FOR UPDATE
    TO public
    USING (
        EXISTS (
            SELECT 1
            FROM koudens k
            JOIN kouden_members km ON k.id = km.kouden_id
            JOIN kouden_roles kr ON km.role_id = kr.id
            WHERE k.id = relationships.kouden_id
            AND km.user_id = auth.uid()
            AND 'edit' = ANY(kr.permissions)
        )
        AND NOT is_default
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM koudens k
            JOIN kouden_members km ON k.id = km.kouden_id
            JOIN kouden_roles kr ON km.role_id = kr.id
            WHERE k.id = relationships.kouden_id
            AND km.user_id = auth.uid()
            AND 'edit' = ANY(kr.permissions)
        )
        AND NOT is_default
    );

-- 権限のあるメンバーの削除ポリシー（デフォルト以外）
CREATE POLICY "enable_delete_for_authorized_members" ON public.relationships
    FOR DELETE
    TO public
    USING (
        EXISTS (
            SELECT 1
            FROM koudens k
            JOIN kouden_members km ON k.id = km.kouden_id
            JOIN kouden_roles kr ON km.role_id = kr.id
            WHERE k.id = relationships.kouden_id
            AND km.user_id = auth.uid()
            AND 'edit' = ANY(kr.permissions)
        )
        AND NOT is_default
    );
```

## 関連するテーブル

- [koudens](./koudens.md) - 香典帳（kouden_id）
- [users](./users.md) - ユーザー（created_by）
- [kouden_entries](./kouden_entries.md) - 香典帳エントリー（relationship_idで参照される）

## 備考

- 香典帳における故人との関係性（例：親族、友人、会社関係など）を管理するテーブルです
- 各香典帳ごとに独自の関係性を定義できます
- デフォルトの関係性は削除や更新ができません（`is_default`フラグで制御）
- RLSポリシーにより、以下のアクセス制御が実装されています：
  - 香典帳のメンバーは関係性の閲覧が可能
  - 編集権限を持つメンバーのみが関係性の追加、更新、削除が可能
  - デフォルトの関係性は更新・削除できない 