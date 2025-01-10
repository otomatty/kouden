-- マイグレーションの実行順序を制御するファイル

-- 1. ユーティリティ関数の作成
\i utils.sql

-- 2. 関係性テーブルの作成
\i relationships.sql

-- 3. 関係性初期化関数の作成
\i functions/initialize_default_relationships.sql

-- 4. 香典帳テーブルの作成
\i koudens.sql

-- 5. 香典情報テーブルの作成
\i kouden_entries.sql

-- 6. 供物テーブルの作成
\i offerings.sql

-- 7. 香典返しテーブルの作成
\i return_items.sql

-- 8. プロフィールテーブルの作成
\i profiles.sql 