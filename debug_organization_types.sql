-- Debug script for organization_types table and policies

-- 1. Check if common schema exists
SELECT schema_name 
FROM information_schema.schemata 
WHERE schema_name = 'common';

-- 2. Check organization_types table in public schema
SELECT 
    table_schema,
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'organization_types'
ORDER BY table_schema, ordinal_position;

-- 3. Check data in public.organization_types (if exists)
SELECT 'public.organization_types' as source, id, name, created_at 
FROM public.organization_types
UNION ALL
-- 4. Check data in common.organization_types (if exists)
SELECT 'common.organization_types' as source, id, name, created_at 
FROM common.organization_types;

-- 5. Check RLS policies for organization_types
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'organization_types'
ORDER BY schemaname, policyname;

-- 6. Check current user and role
SELECT 
    current_user as current_user,
    session_user as session_user,
    current_setting('role') as current_role;

-- 7. Test access to organization_types tables
-- This will show which table is accessible
SELECT 'Can access public.organization_types' as test_result
WHERE EXISTS (SELECT 1 FROM public.organization_types LIMIT 1)
UNION ALL
SELECT 'Can access common.organization_types' as test_result
WHERE EXISTS (SELECT 1 FROM common.organization_types LIMIT 1);

-- 8. Check foreign key constraints referencing organization_types
SELECT
    tc.table_schema,
    tc.table_name,
    kcu.column_name,
    ccu.table_schema AS foreign_table_schema,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND ccu.table_name = 'organization_types'
ORDER BY tc.table_schema, tc.table_name; 