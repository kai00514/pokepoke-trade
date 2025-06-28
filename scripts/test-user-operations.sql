-- 現在認証されているユーザーを確認
SELECT auth.uid() as current_user_id;

-- 現在のユーザーのプロファイルを確認
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
WHERE id = auth.uid();

-- テスト用のポケポケID更新を試行
UPDATE public.users 
SET 
    pokepoke_id = 'TEST12345',
    updated_at = NOW()
WHERE id = auth.uid();

-- テスト用のユーザー名更新を試行
UPDATE public.users 
SET 
    display_name = 'テストユーザー',
    updated_at = NOW()
WHERE id = auth.uid();

-- 更新後の確認
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
WHERE id = auth.uid();

-- 全てのユーザーを確認（管理者用）
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
ORDER BY created_at DESC;
