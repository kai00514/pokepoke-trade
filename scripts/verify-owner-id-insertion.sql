-- Verify that owner_id is being correctly inserted for authenticated users

-- Check current trade_posts data
SELECT 
    id,
    title,
    owner_id,
    guest_name,
    is_authenticated,
    created_at,
    CASE 
        WHEN is_authenticated = true AND owner_id IS NOT NULL THEN '✅ Authenticated with owner_id'
        WHEN is_authenticated = false AND guest_name IS NOT NULL THEN '✅ Guest with guest_name'
        WHEN is_authenticated = true AND owner_id IS NULL THEN '❌ Authenticated but missing owner_id'
        WHEN is_authenticated = false AND guest_name IS NULL THEN '❌ Guest but missing guest_name'
        ELSE '❓ Unknown state'
    END as status_check
FROM trade_posts 
ORDER BY created_at DESC 
LIMIT 10;

-- Check RLS policies for trade_posts
SELECT 
    policyname,
    cmd,
    permissive,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'trade_posts'
ORDER BY cmd, policyname;

-- Verify auth.users table structure (if accessible)
SELECT 
    COUNT(*) as total_auth_users
FROM auth.users;

-- Check if there are any constraint violations
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'trade_posts'::regclass;

-- Summary statistics
SELECT 
    COUNT(*) as total_posts,
    COUNT(CASE WHEN is_authenticated = true THEN 1 END) as authenticated_posts,
    COUNT(CASE WHEN is_authenticated = false THEN 1 END) as guest_posts,
    COUNT(CASE WHEN is_authenticated = true AND owner_id IS NOT NULL THEN 1 END) as valid_authenticated_posts,
    COUNT(CASE WHEN is_authenticated = false AND guest_name IS NOT NULL THEN 1 END) as valid_guest_posts,
    COUNT(CASE WHEN is_authenticated = true AND owner_id IS NULL THEN 1 END) as broken_authenticated_posts,
    COUNT(CASE WHEN is_authenticated = false AND guest_name IS NULL THEN 1 END) as broken_guest_posts
FROM trade_posts;
