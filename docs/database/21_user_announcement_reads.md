# user_announcement_reads テーブル

ユーザーのお知らせ既読状態を管理するテーブルです。

## テーブル定義

```sql
CREATE TABLE public.user_announcement_reads (
    id uuid DEFAULT uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    announcement_id uuid NOT NULL,
    is_read boolean DEFAULT false
);
```

## カラム

| カラム名 | データ型 | NULL | デフォルト | 説明 |
|---------|----------|------|------------|------|
| id | uuid | NO | uuid_generate_v4() | 主キー |
| user_id | uuid | NO | - | ユーザーID |
| announcement_id | uuid | NO | - | お知らせID |
| is_read | boolean | YES | false | 既読フラグ |

## インデックス

```sql
-- 主キーインデックス
CREATE UNIQUE INDEX user_announcement_reads_pkey ON public.user_announcement_reads USING btree (id);

-- ユーザーIDとお知らせIDの組み合わせユニーク制約
CREATE UNIQUE INDEX user_announcement_reads_user_id_announcement_id_key ON public.user_announcement_reads USING btree (user_id, announcement_id);
```

## 外部キー制約

```sql
-- ユーザーIDの外部キー制約
ALTER TABLE ONLY public.user_announcement_reads
    ADD CONSTRAINT user_announcement_reads_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);

-- お知らせIDの外部キー制約
ALTER TABLE ONLY public.user_announcement_reads
    ADD CONSTRAINT user_announcement_reads_announcement_id_fkey FOREIGN KEY (announcement_id) REFERENCES public.system_announcements(id);
```

## RLSポリシー

```sql
-- ユーザーの閲覧ポリシー
CREATE POLICY "Users can view own reads" ON public.user_announcement_reads
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- ユーザーの追加ポリシー
CREATE POLICY "Users can insert own reads" ON public.user_announcement_reads
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- ユーザーの更新ポリシー
CREATE POLICY "Users can update own reads" ON public.user_announcement_reads
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- トリガー関数のアクセスポリシー
CREATE POLICY "Allow trigger function to manage reads" ON public.user_announcement_reads
    FOR ALL
    TO postgres
    USING (true)
    WITH CHECK (true);
```

## 関連するテーブル

- [users](./users.md) - ユーザー（user_id）
- [system_announcements](./system_announcements.md) - システムお知らせ（announcement_id）

## 備考

- ユーザーのお知らせ既読状態を管理するテーブルです
- 以下の特徴があります：
  - ユーザーとお知らせの組み合わせごとに既読状態を管理
  - 1つのお知らせに対して1ユーザーにつき1つの既読状態のみ記録可能（ユニーク制約）
  - デフォルトでは未読状態（is_read = false）
- RLSポリシーにより、以下のアクセス制御が実装されています：
  - ユーザーは自分の既読状態のみ閲覧・追加・更新が可能
  - トリガー関数は全ての操作が可能（システムによる自動処理用）
  - 他のユーザーの既読状態は閲覧・操作不可 