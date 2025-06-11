# ギフトショップ向け管理システム データベース設計

本ドキュメントでは、ギフトショップ向け管理システムの主要テーブル定義とリレーションを示す。

## 共通テーブル
共通テーブルの定義は [共通データベーススキーマ](common-database-schema.md) を参照してください。

## テーブル定義

### loyalty_points
| カラム       | 型             | 制約            | 説明                    |
|--------------|----------------|-----------------|-------------------------|
| id           | UUID           | PK              | ポイントID             |
| customer_id  | UUID           | FK → customers.id | 顧客ID                 |
| points       | INTEGER        | NOT NULL        | ポイント残高            |
| created_at   | TIMESTAMP      | DEFAULT NOW()   | 付与日時               |
| expires_at   | DATE           |                 | 有効期限               |

### tiers
| カラム       | 型            | 制約         | 説明                   |
|--------------|---------------|--------------|------------------------|
| id           | UUID          | PK           | ランクID               |
| name         | VARCHAR(50)   | NOT NULL     | ランク名               |
| threshold    | INTEGER       | NOT NULL     | ランク昇降条件ポイント |

### marketing_campaigns
| カラム         | 型             | 制約          | 説明                      |
|----------------|----------------|---------------|---------------------------|
| id             | UUID           | PK            | キャンペーンID            |
| name           | VARCHAR(100)   | NOT NULL      | キャンペーン名           |
| start_date     | DATE           |               | 開始日                   |
| end_date       | DATE           |               | 終了日                   |
| status         | VARCHAR(50)    |               | ステータス               |

### marketing_templates
| カラム         | 型         | 制約          | 説明               |
|----------------|------------|---------------|--------------------|
| id             | UUID       | PK            | テンプレートID    |
| campaign_id    | UUID       | FK → marketing_campaigns.id | キャンペーンID |
| type           | VARCHAR(10)|               | email/SMS         |
| content        | TEXT       |               | テンプレート内容  |

### products
| カラム        | 型            | 制約          | 説明               |
|---------------|---------------|---------------|--------------------|
| id            | UUID          | PK            | 商品ID             |
| name          | VARCHAR(255)  | NOT NULL      | 商品名             |
| description   | TEXT          |               | 説明               |
| price         | DECIMAL(10,2) | NOT NULL      | 価格               |
| sku           | VARCHAR(100)  | UNIQUE        | 在庫管理コード      |
| created_at    | TIMESTAMP     | DEFAULT NOW() | 登録日時           |
| updated_at    | TIMESTAMP     |               | 更新日時           |

### orders
| カラム        | 型            | 制約            | 説明               |
|---------------|---------------|-----------------|--------------------|
| id            | UUID          | PK              | 注文ID             |
| customer_id   | UUID          | FK → customers.id | 顧客ID           |
| total_amount  | DECIMAL(12,2) | NOT NULL        | 合計金額           |
| status        | VARCHAR(50)   |                 | 注文ステータス     |
| created_at    | TIMESTAMP     | DEFAULT NOW()   | 注文日時           |

### order_items
| カラム        | 型            | 制約            | 説明               |
|---------------|---------------|-----------------|--------------------|
| order_id      | UUID          | FK → orders.id  | 注文ID             |
| product_id    | UUID          | FK → products.id | 商品ID            |
| quantity      | INTEGER       | NOT NULL        | 注文数量           |
| unit_price    | DECIMAL(10,2) | NOT NULL        | 単価               |

### shipping
| カラム       | 型             | 制約              | 説明               |
|--------------|----------------|-------------------|--------------------|
| id           | UUID           | PK                | 配送ID             |
| order_id     | UUID           | FK → orders.id    | 注文ID             |
| carrier      | VARCHAR(100)   |                   | 配送業者           |
| tracking_no  | VARCHAR(100)   | UNIQUE            | 追跡番号           |
| status       | VARCHAR(50)    |                   | 配送ステータス     |
| delivered_at | TIMESTAMP      |                   | 配送完了日時       |

### promotions
| カラム        | 型           | 制約             | 説明               |
|---------------|--------------|------------------|--------------------|
| id            | UUID         | PK               | プロモーションID   |
| code          | VARCHAR(50)  | UNIQUE           | クーポンコード     |
| discount_type | VARCHAR(50)  |                  | 割引種別           |
| discount_value| DECIMAL(10,2)|                  | 割引値             |
| expires_at    | DATE         |                  | 有効期限           |
| created_at    | TIMESTAMP    | DEFAULT NOW()    | 登録日時           |

### support_tickets
| カラム       | 型            | 制約            | 説明               |
|--------------|---------------|-----------------|--------------------|
| id           | UUID          | PK              | チケットID         |
| customer_id  | UUID          | FK → customers.id | 顧客ID           |
| subject      | VARCHAR(255)  | NOT NULL        | 件名               |
| message      | TEXT          | NOT NULL        | メッセージ本文     |
| status       | VARCHAR(50)   |                 | ステータス         |
| created_at   | TIMESTAMP     | DEFAULT NOW()   | 作成日時           |
| updated_at   | TIMESTAMP     |                 | 更新日時           |

## インデックス・制約
- 各テーブルの検索に多用するカラムに適切なインデックスを設定
- 外部キー制約には `ON DELETE CASCADE`, `ON UPDATE CASCADE` を適用 