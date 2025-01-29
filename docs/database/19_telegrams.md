# telegrams テーブル

香典帳に関連する電報の情報を管理するテーブルです。

## テーブル定義

```sql
CREATE TABLE public.telegrams (
    id uuid DEFAULT uuid_generate_v4() NOT NULL,
    kouden_id uuid NOT NULL,
    kouden_entry_id uuid,
    sender_name text NOT NULL,
    sender_organization text,
    sender_position text,
    message text,
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
| kouden_entry_id | uuid | YES | - | 香典帳エントリーのID（任意） |
| sender_name | text | NO | - | 送信者名 |
| sender_organization | text | YES | - | 送信者の所属組織 |
| sender_position | text | YES | - | 送信者の役職 |
| message | text | YES | - | 電報のメッセージ内容 |
| notes | text | YES | - | 備考 |
| created_at | timestamp with time zone | NO | timezone('utc'::text, now()) | 作成日時 |
| updated_at | timestamp with time zone | NO | timezone('utc'::text, now()) | 更新日時 |
| created_by | uuid | NO | - | 作成者のユーザーID |

## インデックス

```sql
-- 主キーインデックス
CREATE UNIQUE INDEX telegrams_pkey ON public.telegrams USING btree (id);

-- 香典帳IDによる検索用インデックス
CREATE INDEX idx_telegrams_kouden_id ON public.telegrams USING btree (kouden_id);

-- 香典帳エントリーIDによる検索用インデックス
CREATE INDEX idx_telegrams_kouden_entry_id ON public.telegrams USING btree (kouden_entry_id);

-- 作成者による検索用インデックス
CREATE INDEX idx_telegrams_created_by ON public.telegrams USING btree (created_by);
```

## 外部キー制約

```sql
-- 香典帳IDの外部キー制約
ALTER TABLE ONLY public.telegrams
    ADD CONSTRAINT telegrams_kouden_id_fkey FOREIGN KEY (kouden_id) REFERENCES public.koudens(id);

-- 香典帳エントリーIDの外部キー制約
ALTER TABLE ONLY public.telegrams
    ADD CONSTRAINT telegrams_kouden_entry_id_fkey FOREIGN KEY (kouden_entry_id) REFERENCES public.kouden_entries(id);

-- 作成者の外部キー制約
ALTER TABLE ONLY public.telegrams
    ADD CONSTRAINT telegrams_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);
```

## RLSポリシー

```sql
-- 閲覧ポリシー
CREATE POLICY "Users can view their own telegrams or telegrams they have acces" ON public.telegrams
    FOR SELECT
    TO authenticated
    USING (
        created_by = auth.uid()
        OR EXISTS (
            SELECT 1
            FROM kouden_members
            WHERE kouden_members.kouden_id = telegrams.kouden_id
            AND kouden_members.user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1
            FROM koudens
            WHERE koudens.id = telegrams.kouden_id
            AND (
                koudens.owner_id = auth.uid()
                OR koudens.created_by = auth.uid()
            )
        )
    );

-- 追加ポリシー
CREATE POLICY "Users can insert telegrams if they have edit access" ON public.telegrams
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM kouden_members m
            JOIN kouden_roles r ON m.role_id = r.id
            WHERE m.kouden_id = telegrams.kouden_id
            AND m.user_id = auth.uid()
            AND r.name = '編集者'
        )
        OR EXISTS (
            SELECT 1
            FROM koudens
            WHERE koudens.id = telegrams.kouden_id
            AND (
                koudens.owner_id = auth.uid()
                OR koudens.created_by = auth.uid()
            )
        )
    );

-- 更新ポリシー
CREATE POLICY "Users can update telegrams if they have edit access" ON public.telegrams
    FOR UPDATE
    TO authenticated
    USING (
        created_by = auth.uid()
        OR EXISTS (
            SELECT 1
            FROM kouden_members m
            JOIN kouden_roles r ON m.role_id = r.id
            WHERE m.kouden_id = telegrams.kouden_id
            AND m.user_id = auth.uid()
            AND r.name = '編集者'
        )
        OR EXISTS (
            SELECT 1
            FROM koudens
            WHERE koudens.id = telegrams.kouden_id
            AND (
                koudens.owner_id = auth.uid()
                OR koudens.created_by = auth.uid()
            )
        )
    );

-- 削除ポリシー
CREATE POLICY "Users can delete telegrams if they have edit access" ON public.telegrams
    FOR DELETE
    TO authenticated
    USING (
        created_by = auth.uid()
        OR EXISTS (
            SELECT 1
            FROM kouden_members m
            JOIN kouden_roles r ON m.role_id = r.id
            WHERE m.kouden_id = telegrams.kouden_id
            AND m.user_id = auth.uid()
            AND r.name = '編集者'
        )
        OR EXISTS (
            SELECT 1
            FROM koudens
            WHERE koudens.id = telegrams.kouden_id
            AND (
                koudens.owner_id = auth.uid()
                OR koudens.created_by = auth.uid()
            )
        )
    );
```

## 関連するテーブル

- [koudens](./koudens.md) - 香典帳（kouden_id）
- [kouden_entries](./kouden_entries.md) - 香典帳エントリー（kouden_entry_id）
- [users](./users.md) - ユーザー（created_by）
- [kouden_members](./kouden_members.md) - 香典帳メンバー（アクセス制御に使用）
- [kouden_roles](./kouden_roles.md) - メンバーロール（アクセス制御に使用）

## 備考

- 香典帳に関連する電報の情報を管理するテーブルです
- 以下の特徴があります：
  - 電報の送信者情報（名前、所属組織、役職）を記録
  - 電報のメッセージ内容や備考を保存
  - 特定の香典帳エントリーに紐づけることが可能（任意）
  - 作成者と更新日時を記録し、変更履歴を追跡可能
- RLSポリシーにより、以下のアクセス制御が実装されています：
  - 香典帳の所有者、作成者、およびメンバーは閲覧が可能
  - 香典帳の所有者、作成者、および編集者権限を持つメンバーは追加・更新・削除が可能
  - 電報の作成者は自身が作成した電報の更新・削除が可能 