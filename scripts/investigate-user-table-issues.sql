-- 1. usersテーブルが存在するか確認
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'users'
) as table_exists;

-- 2. usersテーブルの構造を詳細に確認
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'users'
ORDER BY ordinal_position;

-- 3. usersテーブルの制約を確認
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    tc.is_deferrable,
    tc.initially_deferred
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public' 
AND tc.table_name = 'users';

-- 4. RLSポリシーを詳細に確認
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
WHERE schemaname = 'public' 
AND tablename = 'users';

-- 5. RLSが有効かどうか確認
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    relowner
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'users';

-- 6. 現在認証されているユーザーを確認
SELECT 
    auth.uid() as current_user_id,
    auth.jwt() ->> 'email' as current_user_email;

-- 7. 現在のusersテーブルのデータを確認
SELECT 
    id,
    name,
    email,
    display_name,
    pokepoke_id,
    avatar_url,
    is_admin,
    created_at,
    updated_at
FROM public.users
ORDER BY created_at DESC
LIMIT 10;

-- 8. auth.usersテーブルの情報も確認
SELECT 
    id,
    email,
    created_at,
    updated_at,
    email_confirmed_at,
    last_sign_in_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;
