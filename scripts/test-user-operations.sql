-- テスト用: 現在認証されているユーザーの情報を確認
SELECT 
    id,
    email,
    raw_user_meta_data,
    created_at,
    updated_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- テスト用: public.usersテーブルの最新データを確認
SELECT 
    id,
    name,
    email,
    display_name,
    pokepoke_id,
    avatar_url,
    is_admin,
    created_at
FROM public.users
ORDER BY created_at DESC
LIMIT 10;

-- テスト用: 特定のユーザーIDでレコードを検索
-- 実際のユーザーIDに置き換えてください
-- SELECT * FROM public.users WHERE id = 'your-user-id-here';

-- テスト用: ポケポケIDの重複チェック
SELECT 
    pokepoke_id,
    COUNT(*) as count
FROM public.users
WHERE pokepoke_id IS NOT NULL
GROUP BY pokepoke_id
HAVING COUNT(*) > 1;

-- テスト用: RLSポリシーの詳細確認
SELECT 
    policyname,
    cmd,
    permissive,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'users';
