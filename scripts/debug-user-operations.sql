-- usersテーブルの構造を確認
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'users'
ORDER BY ordinal_position;

-- usersテーブルの制約を確認
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public' 
AND tc.table_name = 'users';

-- RLSポリシーを確認
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

-- 現在のusersテーブルのデータを確認
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

-- RLSが有効かどうか確認
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'users';

-- 現在認証されているユーザーを確認
SELECT auth.uid() as current_user_id;
