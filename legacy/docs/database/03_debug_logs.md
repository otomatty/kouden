# debug_logs テーブル

デバッグログを管理するテーブルです。

## テーブル定義

```sql
CREATE TABLE public.debug_logs (
    id uuid DEFAULT uuid_generate_v4() NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    action text,
    user_id uuid,
    details jsonb
);
```

## カラム

| カラム名 | データ型 | NULL | デフォルト | 説明 |
|---------|----------|------|------------|------|
| id | uuid | NO | uuid_generate_v4() | 主キー |
| created_at | timestamp with time zone | YES | now() | 作成日時 |
| action | text | YES | - | 実行されたアクション |
| user_id | uuid | YES | - | 関連するユーザーID |
| details | jsonb | YES | - | 詳細情報（JSON形式） |

## インデックス

```sql
-- 主キーインデックス
CREATE UNIQUE INDEX debug_logs_pkey ON public.debug_logs USING btree (id);
```

## RLSポリシー

```sql
-- ログ追加ポリシー
CREATE POLICY "Allow insert debug logs" ON public.debug_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- ログ閲覧ポリシー
CREATE POLICY "Allow read own debug logs" ON public.debug_logs
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());
```

## 関連するテーブル

- [users](./users.md) - ユーザー（user_id）

## 備考

- デバッグログを管理するテーブルです
- 以下の特徴があります：
  - アプリケーションのデバッグ情報を記録
  - アクションと詳細情報をJSON形式で保存可能
  - ユーザーに関連するログを記録可能（任意）
  - 作成日時を自動記録
- RLSポリシーにより、以下のアクセス制御が実装されています：
  - 認証済みユーザーはログの追加が可能
  - ユーザーは自分に関連するログのみ閲覧可能
  - ログの更新・削除は不可（監査証跡として保持） 