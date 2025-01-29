# admin_audit_logs テーブル

管理者の操作ログを管理するテーブルです。

## テーブル定義

```sql
CREATE TABLE public.admin_audit_logs (
    id uuid DEFAULT uuid_generate_v4() NOT NULL,
    admin_id uuid NOT NULL,
    action character varying(100) NOT NULL,
    target_type character varying(50) NOT NULL,
    target_id uuid NOT NULL,
    details jsonb,
    ip_address inet,
    created_at timestamp with time zone DEFAULT now()
);
```

## カラム

| カラム名 | データ型 | NULL | デフォルト | 説明 |
|---------|----------|------|------------|------|
| id | uuid | NO | uuid_generate_v4() | 主キー |
| admin_id | uuid | NO | - | 操作を実行した管理者のユーザーID |
| action | character varying(100) | NO | - | 実行された操作の種類 |
| target_type | character varying(50) | NO | - | 操作対象のリソースタイプ |
| target_id | uuid | NO | - | 操作対象のリソースID |
| details | jsonb | YES | - | 操作の詳細情報（JSON形式） |
| ip_address | inet | YES | - | 操作元のIPアドレス |
| created_at | timestamp with time zone | YES | now() | 作成日時 |

## インデックス

```sql
-- 主キーインデックス
CREATE UNIQUE INDEX admin_audit_logs_pkey ON public.admin_audit_logs USING btree (id);
```

## 外部キー制約

```sql
-- 管理者IDの外部キー制約
ALTER TABLE ONLY public.admin_audit_logs
    ADD CONSTRAINT admin_audit_logs_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES auth.users(id);
```

## RLSポリシー

```sql
-- 管理者の閲覧ポリシー
CREATE POLICY "Admins can view audit logs" ON public.admin_audit_logs
    FOR SELECT
    TO authenticated
    USING (is_admin(auth.uid()));

-- システムの追加ポリシー
CREATE POLICY "System can insert audit logs" ON public.admin_audit_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (is_admin(auth.uid()));
```

## 関連するテーブル

- [users](./users.md) - ユーザー（admin_id）
- [admin_users](./admin_users.md) - 管理者ユーザー（アクセス制御に使用）

## 備考

- 管理者の操作ログを管理するテーブルです
- 以下の特徴があります：
  - 管理者が実行した操作の種類と対象を記録
  - 操作の詳細情報をJSON形式で保存可能
  - 操作元のIPアドレスを記録可能
  - 作成日時を自動記録
- RLSポリシーにより、以下のアクセス制御が実装されています：
  - 管理者のみが監査ログの閲覧が可能
  - 管理者のみがログの追加が可能
  - ログの更新・削除は不可（監査証跡として保持）
- 監査ログの用途：
  - 管理者の操作履歴の追跡
  - セキュリティ監査
  - コンプライアンス対応 