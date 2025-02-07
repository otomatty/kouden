# 返礼品管理システム

香典帳アプリケーションにおける返礼品管理システムのデータベース設計について説明します。

## 概要

返礼品管理システムは以下の4つのテーブルで構成されています：

1. `return_item_masters` - 返礼品のマスターデータを管理
2. `delivery_methods` - 配送方法を管理
3. `return_records` - 返礼情報を管理
4. `return_record_items` - 返礼品の詳細情報を管理

## テーブル定義

### 1. return_item_masters（返礼品マスターテーブル）

```sql
CREATE TABLE public.return_item_masters (
id uuid DEFAULT uuid_generate_v4() NOT NULL,
name text NOT NULL,
description text,
price integer NOT NULL,
created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
created_by uuid NOT NULL,
kouden_id uuid NOT NULL
);
```

#### カラム説明

| カラム名 | データ型 | NULL | デフォルト | 説明 |
|---------|----------|------|------------|------|
| id | uuid | NO | uuid_generate_v4() | 主キー |
| name | text | NO | - | 返礼品名 |
| description | text | YES | - | 返礼品の説明 |
| price | integer | NO | - | 返礼品の価格 |
| created_at | timestamp with time zone | NO | now() | 作成日時 |
| updated_at | timestamp with time zone | NO | now() | 更新日時 |
| created_by | uuid | NO | - | 作成者のユーザーID |
| kouden_id | uuid | NO | - | 所属する香典帳のID |

### 2. delivery_methods（配送方法テーブル）

```sql
CREATE TABLE public.delivery_methods (
id uuid DEFAULT uuid_generate_v4() NOT NULL,
name text NOT NULL,
description text,
is_system boolean DEFAULT false NOT NULL,
kouden_id uuid NOT NULL,
created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
created_by uuid NOT NULL
);
```


#### カラム説明

| カラム名 | データ型 | NULL | デフォルト | 説明 |
|---------|----------|------|------------|------|
| id | uuid | NO | uuid_generate_v4() | 主キー |
| name | text | NO | - | 配送方法名 |
| description | text | YES | - | 配送方法の説明 |
| is_system | boolean | NO | false | システム定義の配送方法かどうか |
| kouden_id | uuid | NO | - | 所属する香典帳のID |
| created_at | timestamp with time zone | NO | now() | 作成日時 |
| updated_at | timestamp with time zone | NO | now() | 更新日時 |
| created_by | uuid | NO | - | 作成者のユーザーID |

### 3. return_records（返礼情報テーブル）

```sql
CREATE TABLE public.return_records (
id uuid DEFAULT uuid_generate_v4() NOT NULL,
kouden_id uuid NOT NULL,
kouden_entry_id uuid NOT NULL,
kouden_delivery_method_id uuid NOT NULL,
status text NOT NULL,
shipping_fee integer,
scheduled_date date,
completed_date date,
notes text,
total_amount integer DEFAULT 0,
created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
created_by uuid NOT NULL,
CONSTRAINT status_check CHECK (status IN ('preparing', 'pending', 'completed'))
);
```


#### カラム説明

| カラム名 | データ型 | NULL | デフォルト | 説明 |
|---------|----------|------|------------|------|
| id | uuid | NO | uuid_generate_v4() | 主キー |
| kouden_id | uuid | NO | - | 所属する香典帳のID |
| kouden_entry_id | uuid | NO | - | 香典エントリーID |
| kouden_delivery_method_id | uuid | NO | - | 配送方法ID |
| status | text | NO | - | ステータス（preparing/pending/completed） |
| shipping_fee | integer | YES | - | 配送料金 |
| scheduled_date | date | YES | - | 返礼予定日 |
| completed_date | date | YES | - | 返礼完了日 |
| notes | text | YES | - | 備考 |
| total_amount | integer | NO | 0 | 返礼品の合計金額 |
| created_at | timestamp with time zone | NO | now() | 作成日時 |
| updated_at | timestamp with time zone | NO | now() | 更新日時 |
| created_by | uuid | NO | - | 作成者のユーザーID |

### 4. return_record_items（返礼品詳細テーブル）

```sql
CREATE TABLE public.return_record_items (
id uuid DEFAULT uuid_generate_v4() NOT NULL,
return_record_id uuid NOT NULL,
return_item_master_id uuid NOT NULL,
price integer NOT NULL,
quantity integer DEFAULT 1 NOT NULL,
notes text,
created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
created_by uuid NOT NULL
);
```


#### カラム説明

| カラム名 | データ型 | NULL | デフォルト | 説明 |
|---------|----------|------|------------|------|
| id | uuid | NO | uuid_generate_v4() | 主キー |
| return_record_id | uuid | NO | - | 返礼情報ID |
| return_item_master_id | uuid | NO | - | 返礼品マスターID |
| price | integer | NO | - | 返礼品の価格 |
| quantity | integer | NO | 1 | 数量 |
| notes | text | YES | - | 備考 |
| created_at | timestamp with time zone | NO | now() | 作成日時 |
| updated_at | timestamp with time zone | NO | now() | 更新日時 |
| created_by | uuid | NO | - | 作成者のユーザーID |

## トリガー

### 1. 香典帳作成時の配送方法自動設定

```sql
CREATE OR REPLACE FUNCTION public.on_kouden_created()
RETURNS TRIGGER AS $$
BEGIN
-- システム定義の配送方法を自動的に設定
INSERT INTO public.delivery_methods (
kouden_id,
name,
description,
is_system,
created_by
)
VALUES
(NEW.id, '宅配便', '宅配便での配送', true, NEW.created_by),
(NEW.id, '郵便', '郵便での配送', true, NEW.created_by),
(NEW.id, '訪問', '直接訪問しての手渡し', true, NEW.created_by);
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 2. 返礼情報の合計金額自動計算

```sql
CREATE OR REPLACE FUNCTION update_return_record_total_amount()
RETURNS TRIGGER AS $$
BEGIN
-- return_record_itemsの変更時に合計金額を更新
IF TG_OP IN ('INSERT', 'UPDATE', 'DELETE') THEN
UPDATE return_records
SET total_amount = (
SELECT COALESCE(SUM(price quantity), 0)
FROM return_record_items
WHERE return_record_id = COALESCE(
NEW.return_record_id,
OLD.return_record_id
)
);
END IF;
RETURN NULL;
END;
$$ LANGUAGE plpgsql;
-- トリガーの作成
CREATE TRIGGER tr_update_return_record_total_amount
AFTER INSERT OR UPDATE OR DELETE ON return_record_items
FOR EACH ROW
EXECUTE FUNCTION update_return_record_total_amount();
```


## インデックス

各テーブルには以下のインデックスが設定されています：

### return_item_masters

```sql
CREATE UNIQUE INDEX return_item_masters_pkey ON public.return_item_masters USING btree (id);
CREATE INDEX idx_return_item_masters_kouden_id ON public.return_item_masters USING btree (kouden_id);
```

### delivery_methods

```sql
CREATE UNIQUE INDEX delivery_methods_pkey ON public.delivery_methods USING btree (id);
CREATE INDEX idx_delivery_methods_kouden_id ON public.delivery_methods USING btree (kouden_id);

### return_records

```sql
CREATE UNIQUE INDEX return_records_pkey ON public.return_records USING btree (id);
CREATE INDEX idx_return_records_kouden_id ON public.return_records USING btree (kouden_id);
CREATE INDEX idx_return_records_kouden_entry_id ON public.return_records USING btree (kouden_entry_id);
CREATE INDEX idx_return_records_status ON public.return_records USING btree (status);
CREATE INDEX idx_return_records_scheduled_date ON public.return_records USING btree (scheduled_date);
```

### return_record_items

```sql
CREATE UNIQUE INDEX return_record_items_pkey ON public.return_record_items USING btree (id);
CREATE INDEX idx_return_record_items_return_record_id ON public.return_record_items USING btree (return_record_id);
CREATE INDEX idx_return_record_items_return_item_master_id ON public.return_record_items USING btree (return_item_master_id);
```

## 関連するテーブル

- `koudens` - 香典帳（kouden_id）
- `kouden_entries` - 香典エントリー（kouden_entry_id）
- `users` - ユーザー（created_by）
- `kouden_members` - 香典帳メンバー（アクセス制御）
- `kouden_roles` - 香典帳ロール（権限制御）

## 備考

- 返礼品マスターテーブルでは、返礼品の名称、説明、価格を管理します
- 配送方法テーブルでは、システム定義とユーザー定義の配送方法を統合して管理します
- 香典帳作成時に、システム定義の配送方法が自動的に設定されます
- 返礼情報テーブルでは、返礼のステータス管理と配送情報を管理します
- 返礼品詳細テーブルでは、実際に使用する返礼品の情報を管理します
- すべてのテーブルで適切なRLSポリシーを設定し、セキュリティを確保しています
- インデックスを適切に設定し、検索パフォーマンスを最適化しています
