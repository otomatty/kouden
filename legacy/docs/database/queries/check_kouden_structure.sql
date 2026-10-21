-- 1. テーブル構造の確認
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public'
    AND table_name IN ('koudens', 'kouden_members', 'kouden_roles')
ORDER BY 
    table_name, ordinal_position;

-- 2. 外部キー制約の確認
SELECT
    tc.table_schema, 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_schema AS foreign_table_schema,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE 
    tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'public'
    AND tc.table_name IN ('koudens', 'kouden_members', 'kouden_roles');

-- 3. インデックスの確認
SELECT
    tablename,
    indexname,
    indexdef
FROM
    pg_indexes
WHERE
    schemaname = 'public'
    AND tablename IN ('koudens', 'kouden_members', 'kouden_roles')
ORDER BY
    tablename,
    indexname;

-- 4. トリガーの確認
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing
FROM 
    information_schema.triggers
WHERE 
    trigger_schema = 'public'
    AND event_object_table IN ('koudens', 'kouden_members', 'kouden_roles')
ORDER BY 
    event_object_table,
    trigger_name;

-- 5. RLSポリシーの確認
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM 
    pg_policies
WHERE 
    schemaname = 'public'
    AND tablename IN ('koudens', 'kouden_members', 'kouden_roles')
ORDER BY 
    tablename,
    policyname;

-- 6. 現在のデータの整合性チェック
-- 6.1 メンバーではないオーナーの検出
SELECT 
    k.id as kouden_id,
    k.title,
    k.owner_id,
    k.created_by,
    k.created_at,
    NOT EXISTS (
        SELECT 1 
        FROM kouden_members km 
        WHERE km.kouden_id = k.id 
        AND km.user_id = k.owner_id
    ) as is_owner_not_member
FROM 
    koudens k
WHERE 
    NOT EXISTS (
        SELECT 1 
        FROM kouden_members km 
        WHERE km.kouden_id = k.id 
        AND km.user_id = k.owner_id
    );

-- 6.2 メンバーロールの不整合チェック
SELECT 
    km.kouden_id,
    km.user_id,
    km.role_id,
    kr.name as role_name,
    k.owner_id,
    k.title
FROM 
    kouden_members km
    LEFT JOIN kouden_roles kr ON kr.id = km.role_id
    LEFT JOIN koudens k ON k.id = km.kouden_id
WHERE 
    kr.name IS NULL 
    OR (k.owner_id = km.user_id AND kr.name != 'editor');

-- 6.3 重複メンバーシップの検出
SELECT 
    kouden_id,
    user_id,
    COUNT(*) as membership_count
FROM 
    kouden_members
GROUP BY 
    kouden_id,
    user_id
HAVING 
    COUNT(*) > 1;

-- 7. 統計情報
SELECT
    'koudens' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT owner_id) as unique_owners,
    COUNT(DISTINCT created_by) as unique_creators
FROM
    koudens
UNION ALL
SELECT
    'kouden_members' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(DISTINCT kouden_id) as unique_koudens
FROM
    kouden_members
UNION ALL
SELECT
    'kouden_roles' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT name) as unique_roles,
    COUNT(DISTINCT kouden_id) as unique_koudens
FROM
    kouden_roles; 