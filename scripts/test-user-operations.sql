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
    created_at
FROM public.users
WHERE id = auth.uid();

-- テスト用のポケポケID更新を試行
UPDATE public.users 
SET pokepoke_id = 'TEST12345'
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
    created_at
FROM public.users
WHERE id = auth.uid();
