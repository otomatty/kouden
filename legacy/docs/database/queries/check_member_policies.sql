-- メンバーテーブルのRLSポリシーを確認
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'kouden_members';

-- メンバーテーブルの権限を確認
SELECT 
    grantee, 
    table_name, 
    privilege_type
FROM information_schema.role_table_grants
WHERE table_name = 'kouden_members';

-- 特定の香典帳のメンバー情報を確認するクエリ
-- :kouden_id と :user_id は実行時に置き換えてください
WITH member_info AS (
    SELECT 
        km.id as member_id,
        km.user_id,
        km.kouden_id,
        km.role_id,
        kr.name as role_name,
        p.display_name,
        k.owner_id,
        k.title as kouden_title
    FROM kouden_members km
    LEFT JOIN kouden_roles kr ON km.role_id = kr.id
    LEFT JOIN profiles p ON km.user_id = p.id
    LEFT JOIN koudens k ON km.kouden_id = k.id
    WHERE km.kouden_id = :kouden_id
)
SELECT 
    member_id,
    user_id,
    role_name,
    display_name,
    CASE 
        WHEN user_id = owner_id THEN true 
        ELSE false 
    END as is_owner,
    kouden_title
FROM member_info;

-- メンバーに関連するテーブルの結合テスト
-- これは権限の問題でデータが取得できない場合のデバッグに使用
SELECT 
    COUNT(*) as total_members,
    COUNT(DISTINCT km.user_id) as unique_users,
    COUNT(DISTINCT p.id) as profiles_found,
    COUNT(DISTINCT kr.id) as roles_found
FROM kouden_members km
LEFT JOIN profiles p ON km.user_id = p.id
LEFT JOIN kouden_roles kr ON km.role_id = kr.id
WHERE km.kouden_id = :kouden_id;

-- ユーザーの権限確認
SELECT 
    k.id as kouden_id,
    k.title,
    km.role_id,
    kr.name as role_name,
    CASE 
        WHEN k.owner_id = :user_id THEN 'owner'
        WHEN km.user_id = :user_id THEN kr.name
        ELSE 'no_access'
    END as access_level
FROM koudens k
LEFT JOIN kouden_members km ON k.id = km.kouden_id AND km.user_id = :user_id
LEFT JOIN kouden_roles kr ON km.role_id = kr.id
WHERE k.id = :kouden_id; 