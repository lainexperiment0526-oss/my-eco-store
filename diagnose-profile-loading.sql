-- Diagnostic Script to Check Profile Loading Issues
-- Run this in Supabase SQL Editor to diagnose the "Profile Not Found" issue

-- 1. Check if RLS is enabled on profiles table
SELECT 
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename = 'profiles';

-- 2. Check all policies on profiles table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'profiles';

-- 3. Check if public read policy exists
SELECT COUNT(*) as policy_count
FROM pg_policies
WHERE tablename = 'profiles' 
AND policyname ILIKE '%public%';

-- 4. Test: Try to select profiles as anonymous user (simulates public access)
-- This query should work if RLS policy is correct
SELECT id, username, created_at
FROM public.profiles
LIMIT 5;

-- 5. Check if specific profiles exist
SELECT id, username, email, created_at
FROM public.profiles
WHERE LOWER(username) IN ('wain2020', 'airdropio2024')
ORDER BY username;

-- 6. Check table structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- 7. Check subscriptions table relationship
SELECT 
    tc.table_name,
    kcu.column_name,
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
AND tc.table_name = 'subscriptions';

-- 8. Verify GRANT permissions
SELECT 
    grantee,
    privilege_type,
    table_name
FROM information_schema.table_privileges
WHERE table_name = 'profiles';
