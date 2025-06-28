-- 現在認証されているユーザーを確認
SELECT 
    auth.uid() as current_user_id,
    auth.jwt() ->> 'email' as current_user_email;

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

-- テスト用のレコード挿入を試行（認証されたユーザーIDで）
INSERT INTO public.users (
    id,
    name,
    email,
    display_name,
    pokepoke_id,
    avatar_url,
    is_admin,
    created_at,
    updated_at
) VALUES (
    auth.uid(),
    'テストユーザー',
    auth.jwt() ->> 'email',
    'テスト表示名',
    'TEST12345',
    null,
    false,
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    pokepoke_id = EXCLUDED.pokepoke_id,
    updated_at = NOW();

-- 挿入/更新後の確認
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
