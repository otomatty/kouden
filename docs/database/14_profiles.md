# profiles テーブル

ユーザーのプロフィール情報を管理するテーブルです。

## テーブル定義

```sql
CREATE TABLE public.profiles (
    id uuid NOT NULL,
    display_name text NOT NULL,
    avatar_url text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

## カラム

| カラム名 | データ型 | NULL | デフォルト | 説明 |
|---------|----------|------|------------|------|
| id | uuid | NO | - | 主キー（ユーザーID） |
| display_name | text | NO | - | 表示名 |
| avatar_url | text | YES | - | アバター画像のURL |
| created_at | timestamp with time zone | NO | timezone('utc'::text, now()) | 作成日時 |
| updated_at | timestamp with time zone | NO | timezone('utc'::text, now()) | 更新日時 |

## インデックス

```sql
-- 主キーインデックス
CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id);
```

## 外部キー制約

```sql
-- ユーザーIDの外部キー制約
ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id);
```

## RLSポリシー

```sql
-- プロフィールの公開閲覧ポリシー
CREATE POLICY "Public profiles are viewable by everyone"
    ON public.profiles
    FOR SELECT
    TO public
    USING (true);

-- プロフィールの作成ポリシー
CREATE POLICY "Users can insert their own profile"
    ON public.profiles
    FOR INSERT
    TO public
    WITH CHECK (auth.uid() = id);

-- プロフィールの更新ポリシー
CREATE POLICY "Users can update their own profile"
    ON public.profiles
    FOR UPDATE
    TO public
    USING (auth.uid() = id);
```

## 関連するテーブル

- [users](./users.md) - 認証用ユーザーテーブル（id）
- [koudens](./koudens.md) - 香典帳（created_by, owner_id）
- [kouden_members](./kouden_members.md) - 香典帳メンバー（user_id）
- [kouden_entries](./kouden_entries.md) - 香典帳エントリー（created_by）
- [offerings](./offerings.md) - お供え物（created_by）

## 備考

- ユーザーの基本的なプロフィール情報を管理する中心的なテーブルです
- `auth.users`テーブルと1:1で関連付けられています
- RLSポリシーにより、以下のアクセス制御が実装されています：
  - プロフィール情報は誰でも閲覧可能
  - プロフィールの作成は本人のみ可能
  - プロフィールの更新は本人のみ可能
- アバター画像のURLは任意（NULL許容）です 