# 共通データベーススキーマ

本ドキュメントでは、葬儀会社管理システムおよびギフトショップ管理システムで共通して利用するテーブル定義をまとめる。

## テーブル定義

### customers
| カラム        | 型            | 制約         | 説明           |
|---------------|---------------|--------------|----------------|
| id            | UUID          | PK           | 顧客ID         |
| name          | VARCHAR(255)  | NOT NULL     | 氏名           |
| email         | VARCHAR(255)  | UNIQUE       | メールアドレス |
| phone         | VARCHAR(20)   |              | 電話番号       |
| created_at    | TIMESTAMP     | DEFAULT NOW()| 登録日時       |
| updated_at    | TIMESTAMP     |              | 更新日時       |

### invoices
| カラム       | 型            | 制約             | 説明               |
|--------------|---------------|------------------|--------------------|
| id           | UUID          | PK               | 請求ID             |
| case_id      | UUID          | FK → cases.id    | 関連案件ID         |
| amount       | DECIMAL(12,2) |                  | 金額               |
| due_date     | DATE          |                  | 支払期日           |
| paid_at      | TIMESTAMP     |                  | 入金日時           |
| status       | VARCHAR(50)   |                  | 支払ステータス     |
| created_at   | TIMESTAMP     | DEFAULT NOW()    | 登録日時           |

### inventory
| カラム       | 型            | 制約             | 説明               |
|--------------|---------------|------------------|--------------------|
| id           | UUID          | PK               | 在庫ID             |
| item         | VARCHAR(255)  |                  | 品目               |
| stock_level  | INTEGER       |                  | 現在在庫数         |
| updated_at   | TIMESTAMP     |                  | 更新日時           |

### users
| カラム     | 型           | 制約           | 説明        |
|------------|--------------|----------------|-------------|
| id         | UUID         | PK             | ユーザーID  |
| name       | VARCHAR(255) |                | 氏名        |
| email      | VARCHAR(255) | UNIQUE         | メール      |
| role_id    | UUID         | FK → roles.id  | ロールID    |
| created_at | TIMESTAMP    | DEFAULT NOW()  | 登録日時    |

### roles
| カラム   | 型           | 制約           | 説明        |
|----------|--------------|----------------|-------------|
| id       | UUID         | PK             | ロールID    |
| name     | VARCHAR(50)  | UNIQUE         | ロール名    |

### permissions
| カラム    | 型           | 制約           | 説明        |
|-----------|--------------|----------------|-------------|
| id        | UUID         | PK             | 権限ID      |
| action    | VARCHAR(100) |                | 操作名      |
| resource  | VARCHAR(100) |                | リソース名  |

### role_permissions
| カラム        | 型            | 制約                  | 説明           |
|---------------|---------------|-----------------------|----------------|
| role_id       | UUID          | FK → roles.id         | ロールID       |
| permission_id | UUID          | FK → permissions.id   | 権限ID         |

## インデックス・制約
- 各テーブルの検索に多用するカラム（email, status, created_at）に適切なインデックスを設定
- 外部キー制約には `ON DELETE CASCADE`, `ON UPDATE CASCADE` を適用 