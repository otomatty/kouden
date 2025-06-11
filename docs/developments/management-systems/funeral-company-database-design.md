# 葬儀会社向け管理システム データベース設計

本ドキュメントでは、葬儀会社向け管理システムの主要テーブル定義とリレーションを示す。

## ER図 (概要)
- 顧客 (customers) 1:N 葬儀案件 (cases)
- 葬儀案件 (cases) 1:N 参列者 (attendees), 香典受付記録 (donations), 見積 (quotes), 請求 (invoices), 資材発注 (material_orders), タスク (tasks)
- 顧客 (customers) 1:N オンライン予約 (reservations)
- ユーザー (users) 1:N タスク (tasks)
- ロール (roles) N:M 権限 (permissions)

## テーブル定義

### customers
| カラム        | 型            | 制約         | 説明           |
|---------------|---------------|--------------|----------------|
| id            | UUID          | PK           | 顧客ID         |
| name          | VARCHAR(255)  | NOT NULL     | 氏名           |
| email         | VARCHAR(255)  | UNIQUE       | メールアドレス |
| phone         | VARCHAR(20)   |              | 電話番号       |
| religion      | VARCHAR(100)  |              | 宗派           |
| allergy       | VARCHAR(255)  |              | アレルギー情報 |
| created_at    | TIMESTAMP     | DEFAULT NOW()| 登録日時       |
| updated_at    | TIMESTAMP     |              | 更新日時       |

### cases
| カラム            | 型           | 制約             | 説明                     |
|-------------------|--------------|------------------|--------------------------|
| id                | UUID         | PK               | 案件ID                   |
| customer_id       | UUID         | FK → customers.id| 顧客ID                   |
| deceased_name     | VARCHAR(255) | NOT NULL         | 故人氏名                 |
| venue             | VARCHAR(255) |                  | 会場                     |
| start_datetime    | TIMESTAMP    |                  | 施行日時                 |
| status            | VARCHAR(50)  |                  | 案件ステータス           |
| created_at        | TIMESTAMP    | DEFAULT NOW()    | 登録日時                 |
| updated_at        | TIMESTAMP    |                  | 更新日時                 |

### attendees
| カラム         | 型          | 制約             | 説明               |
|----------------|-------------|------------------|--------------------|
| id             | UUID        | PK               | 参列者ID           |
| case_id        | UUID        | FK → cases.id    | 対象案件ID         |
| name           | VARCHAR(255)| NOT NULL         | 参列者氏名         |
| relation       | VARCHAR(100)|                  | 続柄               |
| status         | VARCHAR(50) |                  | 出欠ステータス     |
| created_at     | TIMESTAMP   | DEFAULT NOW()    | 登録日時           |

### donations
| カラム         | 型          | 制約             | 説明               |
|----------------|-------------|------------------|--------------------|
| id             | UUID        | PK               | 記録ID             |
| case_id        | UUID        | FK → cases.id    | 対象案件ID         |
| donor_name     | VARCHAR(255)|                  | 寄付者氏名         |
| amount         | DECIMAL(10,2)|                 | 金額               |
| received_at    | TIMESTAMP   |                  | 受付日時           |
| created_at     | TIMESTAMP   | DEFAULT NOW()    | 登録日時           |

### contacts
| カラム         | 型          | 制約             | 説明               |
|----------------|-------------|------------------|--------------------|
| id             | UUID        | PK               | 連絡ID             |
| customer_id    | UUID        | FK → customers.id| 顧客ID             |
| type           | VARCHAR(10) |                  | email/SMS          |
| template       | TEXT        |                  | テンプレート内容   |
| last_sent_at   | TIMESTAMP   |                  | 最終送信日時       |

### quotes
| カラム         | 型           | 制約             | 説明               |
|----------------|--------------|------------------|--------------------|
| id             | UUID         | PK               | 見積ID             |
| case_id        | UUID         | FK → cases.id    | 対象案件ID         |
| total_amount   | DECIMAL(12,2)|                  | 合計金額           |
| pdf_url        | TEXT         |                  | PDF保管URL         |
| status         | VARCHAR(50)  |                  | 見積ステータス     |
| created_at     | TIMESTAMP    | DEFAULT NOW()    | 登録日時           |

### invoices
| カラム         | 型            | 制約             | 説明               |
|----------------|---------------|------------------|--------------------|
| id             | UUID          | PK               | 請求ID             |
| case_id        | UUID          | FK → cases.id    | 対象案件ID         |
| amount         | DECIMAL(12,2) |                  | 金額               |
| due_date       | DATE          |                  | 支払期日           |
| paid_at        | TIMESTAMP     |                  | 入金日時           |
| status         | VARCHAR(50)   |                  | 支払ステータス     |
| created_at     | TIMESTAMP     | DEFAULT NOW()    | 登録日時           |

### material_orders
| カラム         | 型            | 制約             | 説明               |
|----------------|---------------|------------------|--------------------|
| id             | UUID          | PK               | 発注ID             |
| case_id        | UUID          | FK → cases.id    | 関連案件ID         |
| item           | VARCHAR(255)  |                  | 品目               |
| quantity       | INTEGER       |                  | 注文数量           |
| order_date     | TIMESTAMP     |                  | 発注日             |
| status         | VARCHAR(50)   |                  | 発注ステータス     |

### inventory
| カラム         | 型            | 制約             | 説明               |
|----------------|---------------|------------------|--------------------|
| id             | UUID          | PK               | 在庫ID             |
| item           | VARCHAR(255)  |                  | 品目               |
| stock_level    | INTEGER       |                  | 現在在庫数         |
| updated_at     | TIMESTAMP     |                  | 更新日時           |

### tasks
| カラム         | 型            | 制約             | 説明               |
|----------------|---------------|------------------|--------------------|
| id             | UUID          | PK               | タスクID           |
| case_id        | UUID          | FK → cases.id    | 関連案件ID         |
| assigned_to    | UUID          | FK → users.id    | 担当者ID           |
| due_date       | DATE          |                  | 期限               |
| status         | VARCHAR(50)   |                  | タスクステータス   |
| created_at     | TIMESTAMP     | DEFAULT NOW()    | 登録日時           |

### reservations
| カラム         | 型            | 制約             | 説明               |
|----------------|---------------|------------------|--------------------|
| id             | UUID          | PK               | 予約ID             |
| customer_id    | UUID          | FK → customers.id| 顧客ID             |
| date           | DATE          |                  | 予約日             |
| status         | VARCHAR(50)   |                  | 予約ステータス     |
| created_at     | TIMESTAMP     | DEFAULT NOW()    | 登録日時           |

### users / roles / permissions
#### users
| カラム       | 型           | 制約           | 説明        |
|--------------|--------------|----------------|-------------|
| id           | UUID         | PK             | ユーザーID  |
| name         | VARCHAR(255) |                | 氏名        |
| email        | VARCHAR(255) | UNIQUE         | メール      |
| role_id      | UUID         | FK → roles.id  | ロールID    |
| created_at   | TIMESTAMP    | DEFAULT NOW()  | 登録日時    |

#### roles
| カラム       | 型           | 制約           | 説明        |
|--------------|--------------|----------------|-------------|
| id           | UUID         | PK             | ロールID    |
| name         | VARCHAR(50)  | UNIQUE         | ロール名    |

#### permissions
| カラム       | 型           | 制約           | 説明        |
|--------------|--------------|----------------|-------------|
| id           | UUID         | PK             | 権限ID      |
| action       | VARCHAR(100) |                | 操作名      |
| resource     | VARCHAR(100) |                | リソース名  |

#### role_permissions
| カラム        | 型            | 制約                  | 説明           |
|---------------|---------------|-----------------------|----------------|
| role_id       | UUID          | FK → roles.id         | ロールID       |
| permission_id | UUID          | FK → permissions.id   | 権限ID         |

### インデックス・制約
- 各テーブルの `created_at`, `status`, `name` 等の検索に多用するカラムにインデックスを設定
- 外部キー制約には `ON DELETE CASCADE`, `ON UPDATE CASCADE` を適用 