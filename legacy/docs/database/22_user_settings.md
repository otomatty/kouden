# user_settings テーブル

ユーザーの設定情報を管理するテーブルです。

## テーブル定義

```sql
CREATE TABLE public.user_settings (
    id uuid NOT NULL,
    guide_mode boolean DEFAULT true,
    theme text DEFAULT 'system'::text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

## カラム

| カラム名 | データ型 | NULL | デフォルト | 説明 |
|---------|----------|------|------------|------|
| id | uuid | NO | - | 主キー（ユーザーID） |
| guide_mode | boolean | YES | true | ガイドモードの有効/無効 |
| theme | text | YES | 'system' | テーマ設定（'system', 'light', 'dark'など） |
| created_at | timestamp with time zone | NO | timezone('utc'::text, now()) | 作成日時 |
| updated_at | timestamp with time zone | NO | timezone('utc'::text, now()) | 更新日時 |

## インデックス

```sql
-- 主キーインデックス
CREATE UNIQUE INDEX user_settings_pkey ON public.user_settings USING btree (id);
```

## 外部キー制約

```sql
-- ユーザーIDの外部キー制約
ALTER TABLE ONLY public.user_settings
    ADD CONSTRAINT user_settings_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id);
```

## RLSポリシー

```sql
-- ユーザーの閲覧ポリシー
CREATE POLICY "Users can view their own settings" ON public.user_settings
    FOR SELECT
    TO public
    USING (auth.uid() = id);

-- ユーザーの更新ポリシー
CREATE POLICY "Users can update their own settings" ON public.user_settings
    FOR UPDATE
    TO public
    USING (auth.uid() = id);

-- ユーザーの追加ポリシー
CREATE POLICY "Users can insert their own settings" ON public.user_settings
    FOR INSERT
    TO public
    WITH CHECK (auth.uid() = id);
```

## 関連するテーブル

- [users](./users.md) - ユーザー（id）

## 備考

- ユーザーの設定情報を管理するテーブルです
- 以下の特徴があります：
  - ユーザーIDを主キーとして使用（1ユーザーにつき1つの設定）
  - ガイドモードはデフォルトで有効
  - テーマはデフォルトでシステム設定に従う
  - 作成日時と更新日時を自動記録
- RLSポリシーにより、以下のアクセス制御が実装されています：
  - ユーザーは自分の設定のみ閲覧・更新・追加が可能
  - 他のユーザーの設定は閲覧・操作不可
  - 設定の削除は不可（ユーザーが存在する限り設定も存在） 