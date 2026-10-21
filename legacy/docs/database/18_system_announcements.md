# system_announcements テーブル

システムのお知らせを管理するテーブルです。

## テーブル定義

```sql
CREATE TABLE public.system_announcements (
    id uuid DEFAULT uuid_generate_v4() NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    priority character varying(20) DEFAULT 'normal'::character varying NOT NULL,
    status character varying(20) DEFAULT 'draft'::character varying NOT NULL,
    published_at timestamp with time zone,
    expires_at timestamp with time zone,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    category character varying(50) DEFAULT 'other'::character varying NOT NULL
);
```

## カラム

| カラム名 | データ型 | NULL | デフォルト | 説明 |
|---------|----------|------|------------|------|
| id | uuid | NO | uuid_generate_v4() | 主キー |
| title | text | NO | - | お知らせのタイトル |
| content | text | NO | - | お知らせの内容 |
| priority | character varying(20) | NO | 'normal' | 優先度（'normal', 'high', 'low'など） |
| status | character varying(20) | NO | 'draft' | ステータス（'draft', 'published'など） |
| published_at | timestamp with time zone | YES | - | 公開日時 |
| expires_at | timestamp with time zone | YES | - | 有効期限 |
| created_by | uuid | NO | - | 作成者のユーザーID |
| created_at | timestamp with time zone | YES | now() | 作成日時 |
| updated_at | timestamp with time zone | YES | now() | 更新日時 |
| category | character varying(50) | NO | 'other' | カテゴリー |

## インデックス

```sql
-- 主キーインデックス
CREATE UNIQUE INDEX system_announcements_pkey ON public.system_announcements USING btree (id);
```

## 外部キー制約

```sql
-- 作成者の外部キー制約
ALTER TABLE ONLY public.system_announcements
    ADD CONSTRAINT system_announcements_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);
```

## RLSポリシー

```sql
-- ユーザーの閲覧ポリシー（公開済みのお知らせのみ）
CREATE POLICY "Users can view published announcements" ON public.system_announcements
    FOR SELECT
    TO authenticated
    USING (
        status::text = 'published'::text
        AND published_at <= now()
        AND (expires_at IS NULL OR expires_at > now())
    );

-- 管理者の閲覧ポリシー（全てのお知らせ）
CREATE POLICY "Admins can view all announcements" ON public.system_announcements
    FOR SELECT
    TO authenticated
    USING (is_admin(auth.uid()));

-- 管理者の追加ポリシー
CREATE POLICY "Admins can insert announcements" ON public.system_announcements
    FOR INSERT
    TO authenticated
    WITH CHECK (is_admin(auth.uid()));

-- 管理者の更新ポリシー
CREATE POLICY "Admins can update announcements" ON public.system_announcements
    FOR UPDATE
    TO authenticated
    USING (is_admin(auth.uid()));

-- 管理者の削除ポリシー
CREATE POLICY "Admins can delete announcements" ON public.system_announcements
    FOR DELETE
    TO authenticated
    USING (is_admin(auth.uid()));
```

## 関連するテーブル

- [users](./users.md) - ユーザー（created_by）
- [admin_users](./admin_users.md) - 管理者ユーザー（アクセス制御に使用）
- [user_announcement_reads](./user_announcement_reads.md) - ユーザーのお知らせ既読状態

## 備考

- システムのお知らせを管理するテーブルです
- 以下の特徴があります：
  - お知らせのタイトル、内容、優先度、カテゴリーを管理
  - 公開日時と有効期限を設定可能
  - ステータス管理により下書きと公開を制御
  - 作成者と作成・更新日時を記録
- RLSポリシーにより、以下のアクセス制御が実装されています：
  - 一般ユーザーは公開済みかつ有効期限内のお知らせのみ閲覧可能
  - 管理者は全てのお知らせの閲覧が可能
  - 管理者のみがお知らせの追加・更新・削除が可能 