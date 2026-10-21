# 返礼品管理システム

返礼品管理機能では、以下の3つのテーブルで構成されています：
1. `return_records` - 返礼情報を管理
2. `return_record_selected_methods` - 返礼方法の選択情報を管理
3. `return_method_types` - 返礼方法のマスターデータを管理

## テーブル定義

### 1. return_records（返礼情報テーブル）

```sql
CREATE TABLE public.return_records (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  koden_id uuid NOT NULL,
  status character varying(50) NOT NULL,
  arrangement_date date NULL,
  remarks text NULL,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT return_records_pkey PRIMARY KEY (id),
  CONSTRAINT return_records_koden_info_id_unique UNIQUE (koden_info_id),
  CONSTRAINT return_records_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT return_records_koden_info_id_fkey FOREIGN KEY (koden_info_id) REFERENCES koudens (id) ON UPDATE CASCADE ON DELETE RESTRICT
) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_return_records_koden_info_id ON public.return_records USING btree (koden_info_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_return_records_status ON public.return_records USING btree (status) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_return_records_arrangement_date ON public.return_records USING btree (arrangement_date) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_return_records_created_by ON public.return_records USING btree (created_by) TABLESPACE pg_default;
```

#### カラム説明

| カラム名           | データ型                        | NULL | デフォルト                                   | 説明                    |
|--------------------|---------------------------------|------|----------------------------------------------|-------------------------|
| id                 | uuid                            | NO   | extensions.uuid_generate_v4()                | 主キー                  |
| koden_info_id      | uuid                            | NO   | -                                            | 香典帳情報ID            |
| status             | character varying(50)           | NO   | -                                            | ステータス              |
| arrangement_date   | date                            | YES  | -                                            | 返礼手配日              |
| remarks            | text                            | YES  | -                                            | 備考                    |
| created_by         | uuid                            | NO   | -                                            | 作成者のユーザーID      |
| created_at         | timestamp with time zone        | NO   | timezone('utc'::text, now())                 | 作成日時                |
| updated_at         | timestamp with time zone        | NO   | timezone('utc'::text, now())                 | 更新日時                |

### 2. return_record_selected_methods（返礼方法選択テーブル）

```sql
CREATE TABLE public.return_record_selected_methods (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  return_record_id uuid NOT NULL,
  return_method_type_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT return_record_selected_methods_pkey PRIMARY KEY (id),
  CONSTRAINT return_record_selected_methods_unique UNIQUE (return_record_id, return_method_type_id),
  CONSTRAINT return_record_selected_methods_return_method_type_id_fkey FOREIGN KEY (return_method_type_id) REFERENCES return_method_types (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT return_record_selected_methods_return_record_id_fkey FOREIGN KEY (return_record_id) REFERENCES return_records (id) ON UPDATE CASCADE ON DELETE CASCADE
) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_return_record_selected_methods_return_record_id ON public.return_record_selected_methods USING btree (return_record_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_return_record_selected_methods_return_method_type_id ON public.return_record_selected_methods USING btree (return_method_type_id) TABLESPACE pg_default;
```

#### カラム説明

| カラム名               | データ型                 | NULL | デフォルト                             | 説明                        |
|------------------------|--------------------------|------|----------------------------------------|-----------------------------|
| id                     | uuid                     | NO   | extensions.uuid_generate_v4()          | 主キー                      |
| return_record_id       | uuid                     | NO   | -                                      | 返礼情報ID                  |
| return_method_type_id  | uuid                     | NO   | -                                      | 返礼方法タイプID            |
| created_at             | timestamp with time zone | NO   | timezone('utc'::text, now())           | 作成日時                    |
| updated_at             | timestamp with time zone | NO   | timezone('utc'::text, now())           | 更新日時                    |

### 3. return_method_types（返礼方法種別マスターテーブル）

```sql
CREATE TABLE public.return_method_types (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  name text NOT NULL,
  description text NULL,
  is_item_required boolean NOT NULL DEFAULT false,
  sort_order integer NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT return_method_types_pkey PRIMARY KEY (id),
  CONSTRAINT return_method_types_name_unique UNIQUE (name)
) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_return_method_types_name ON public.return_method_types USING btree (name) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_return_method_types_sort_order ON public.return_method_types USING btree (sort_order) TABLESPACE pg_default;
```

#### カラム説明

| カラム名             | データ型                        | NULL | デフォルト                                   | 説明                    |
|----------------------|---------------------------------|------|----------------------------------------------|-------------------------|
| id                   | uuid                            | NO   | extensions.uuid_generate_v4()                | 主キー                  |
| name                 | text                            | NO   | -                                            | 返礼方法名              |
| description          | text                            | YES  | -                                            | 返礼方法の説明          |
| is_item_required     | boolean                         | NO   | false                                        | 項目必須フラグ          |
| sort_order           | integer                         | YES  | -                                            | 表示順                  |
| created_at           | timestamp with time zone        | NO   | timezone('utc'::text, now())                 | 作成日時                |
| updated_at           | timestamp with time zone        | NO   | timezone('utc'::text, now())                 | 更新日時                |

### 4. return_items（返礼品マスターテーブル）

```sql
CREATE TABLE public.return_items (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  name text NOT NULL,
  description text NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  created_by uuid NOT NULL,
  kouden_id uuid NOT NULL,
  price integer NOT NULL,
  CONSTRAINT return_item_masters_pkey PRIMARY KEY (id),
  CONSTRAINT return_item_masters_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users (id),
  CONSTRAINT return_item_masters_kouden_id_fkey FOREIGN KEY (kouden_id) REFERENCES koudens (id)
) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_return_item_masters_created_by ON public.return_items USING btree (created_by) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_return_item_masters_kouden_id ON public.return_items USING btree (kouden_id) TABLESPACE pg_default;
```

#### カラム説明

| カラム名     | データ型                     | NULL | デフォルト                           | 説明              |
|--------------|------------------------------|------|--------------------------------------|-------------------|
| id           | uuid                         | NO   | extensions.uuid_generate_v4()        | 主キー            |
| name         | text                         | NO   | -                                    | 返礼品名          |
| description  | text                         | YES  | -                                    | 返礼品の説明      |
| created_at   | timestamp with time zone     | NO   | timezone('utc'::text, now())         | 作成日時          |
| updated_at   | timestamp with time zone     | NO   | timezone('utc'::text, now())         | 更新日時          |
| created_by   | uuid                         | NO   | -                                    | 作成者のユーザーID|
| kouden_id    | uuid                         | NO   | -                                    | 香典帳情報ID      |
| price        | integer                      | NO   | -                                    | 価格              |

### 5. return_record_items（返礼品詳細テーブル）

```sql
CREATE TABLE public.return_record_items (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  return_record_id uuid NOT NULL,
  return_item_master_id uuid NOT NULL,
  price integer NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  notes text NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  created_by uuid NOT NULL,
  CONSTRAINT return_record_items_pkey PRIMARY KEY (id),
  CONSTRAINT return_record_items_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users (id),
  CONSTRAINT return_record_items_return_item_master_id_fkey FOREIGN KEY (return_item_master_id) REFERENCES return_items (id) ON DELETE CASCADE
) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_return_record_items_return_item_master_id ON public.return_record_items USING btree (return_item_master_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_return_record_items_return_record_id ON public.return_record_items USING btree (return_record_id) TABLESPACE pg_default;
```

#### カラム説明

| カラム名               | データ型                     | NULL | デフォルト                           | 説明              |
|------------------------|------------------------------|------|--------------------------------------|-------------------|
| id                     | uuid                         | NO   | extensions.uuid_generate_v4()        | 主キー            |
| return_record_id       | uuid                         | NO   | -                                    | 返礼情報ID        |
| return_item_master_id  | uuid                         | NO   | -                                    | 返礼品マスターID  |
| price                  | integer                      | NO   | -                                    | 単価              |
| quantity               | integer                      | NO   | 1                                    | 数量              |
| notes                  | text                         | YES  | -                                    | 備考              |
| created_at             | timestamp with time zone     | NO   | timezone('utc'::text, now())         | 作成日時          |
| updated_at             | timestamp with time zone     | NO   | timezone('utc'::text, now())         | 更新日時          |
| created_by             | uuid                         | NO   | -                                    | 作成者のユーザーID|

### 6. return_record_item_entries（返礼品アイテムと香典帳エントリーの紐付けテーブル）

```sql
CREATE TABLE public.return_record_item_entries (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  return_record_item_id uuid NOT NULL,
  kouden_entry_id uuid NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  notes text NULL,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT return_record_item_entries_pkey PRIMARY KEY (id),
  CONSTRAINT rrient_return_record_item_fkey FOREIGN KEY (return_record_item_id) REFERENCES public.return_record_items (id) ON DELETE CASCADE,
  CONSTRAINT rrient_kouden_entry_fkey FOREIGN KEY (kouden_entry_id) REFERENCES public.kouden_entries (id) ON DELETE CASCADE
) TABLESPACE pg_default;

CREATE UNIQUE INDEX uniq_rrient_return_item_entry ON public.return_record_item_entries (return_record_item_id, kouden_entry_id);
CREATE INDEX idx_rrient_return_record_item_id ON public.return_record_item_entries (return_record_item_id);
CREATE INDEX idx_rrient_kouden_entry_id ON public.return_record_item_entries (kouden_entry_id);
```

#### カラム説明

| カラム名                 | データ型                        | NULL | デフォルト                                   | 説明                                       |
|--------------------------|---------------------------------|------|----------------------------------------------|--------------------------------------------|
| id                       | uuid                            | NO   | extensions.uuid_generate_v4()                | 主キー                                     |
| return_record_item_id    | uuid                            | NO   | -                                            | 返礼品詳細情報ID                           |
| kouden_entry_id          | uuid                            | NO   | -                                            | 香典帳エントリーID                         |
| quantity                 | integer                         | NO   | 1                                            | 割り当て数量                               |
| notes                    | text                            | YES  | -                                            | 備考                                       |
| created_by               | uuid                            | NO   | -                                            | 作成者ユーザーID                           |
| created_at               | timestamp with time zone        | NO   | timezone('utc'::text, now())                 | 作成日時                                   |
| updated_at               | timestamp with time zone        | NO   | timezone('utc'::text, now())                 | 更新日時                                   |

## トリガー

```sql
CREATE TRIGGER tr_update_return_record_total_amount
  AFTER INSERT OR DELETE OR UPDATE ON public.return_record_items
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
- `return_record_item_entries` - 返礼品アイテムと香典帳エントリーの紐付けテーブル

## 備考

- 返礼品マスターテーブルでは、返礼品の名称、説明、価格を管理します
- 配送方法テーブルでは、システム定義とユーザー定義の配送方法を統合して管理します
- 香典帳作成時に、システム定義の配送方法が自動的に設定されます
- 返礼情報テーブルでは、返礼のステータス管理と配送情報を管理します
- 返礼品詳細テーブルでは、実際に使用する返礼品の情報を管理します
- すべてのテーブルで適切なRLSポリシーを設定し、セキュリティを確保しています
- インデックスを適切に設定し、検索パフォーマンスを最適化しています
