-- 1. koudensテーブルのポリシー確認
SELECT schemaname,
       tablename,
       policyname,
       permissive,
       roles,
       cmd,
       qual,
       with_check
FROM pg_policies
WHERE tablename = 'koudens'
ORDER BY policyname;

-- 2. kouden_membersテーブルのポリシー確認
SELECT schemaname,
       tablename,
       policyname,
       permissive,
       roles,
       cmd,
       qual,
       with_check
FROM pg_policies
WHERE tablename = 'kouden_members'
ORDER BY policyname;

-- 3. kouden_rolesテーブルのポリシー確認
SELECT schemaname,
       tablename,
       policyname,
       permissive,
       roles,
       cmd,
       qual,
       with_check
FROM pg_policies
WHERE tablename = 'kouden_roles'
ORDER BY policyname;

-- 4. ポリシーの依存関係を確認
WITH RECURSIVE policy_dependencies AS (
    -- 基本のポリシー
    SELECT tablename,
           policyname,
           qual::text as dependency,
           1 as level
    FROM pg_policies
    WHERE tablename IN ('koudens', 'kouden_members', 'kouden_roles')
    
    UNION ALL
    
    -- 再帰的に依存関係を検索
    SELECT p.tablename,
           p.policyname,
           p.qual::text,
           pd.level + 1
    FROM pg_policies p
    INNER JOIN policy_dependencies pd
    ON p.qual::text LIKE '%' || pd.tablename || '%'
    WHERE p.tablename IN ('koudens', 'kouden_members', 'kouden_roles')
    AND pd.level < 5  -- 無限ループを防ぐための制限
)
SELECT DISTINCT
    tablename,
    policyname,
    dependency,
    level
FROM policy_dependencies
ORDER BY level, tablename, policyname;

-- 5. 循環参照の可能性がある箇所を特定
WITH RECURSIVE circular_check AS (
    SELECT tablename,
           policyname,
           qual::text as policy_definition,
           ARRAY[tablename] as path,
           1 as level
    FROM pg_policies
    WHERE tablename IN ('koudens', 'kouden_members', 'kouden_roles')
    
    UNION ALL
    
    SELECT p.tablename,
           p.policyname,
           p.qual::text,
           cc.path || p.tablename,
           cc.level + 1
    FROM pg_policies p
    INNER JOIN circular_check cc
    ON p.qual::text LIKE '%' || cc.tablename || '%'
    WHERE p.tablename IN ('koudens', 'kouden_members', 'kouden_roles')
    AND p.tablename <> ALL(cc.path)  -- 循環を検出
    AND cc.level < 5  -- 深さの制限
)
SELECT tablename,
       policyname,
       policy_definition,
       path,
       level
FROM circular_check
WHERE array_length(path, 1) > 1  -- 少なくとも2つのテーブルを含む経路
ORDER BY level, tablename; 