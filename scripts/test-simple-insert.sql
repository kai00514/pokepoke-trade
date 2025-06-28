-- 現在の認証状態を確認
SELECT 
  auth.uid() as user_id,
  auth.email() as user_email,
  auth.role() as user_role;

-- 現在のusersテーブルの状態を確認
SELECT COUNT(*) as total_users FROM public.users;

-- テストデータを挿入（現在の認証ユーザーのIDを使用）
DO $$
DECLARE
  current_user_id uuid;
  current_user_email text;
BEGIN
  -- 現在のユーザー情報を取得
  SELECT auth.uid(), auth.email() INTO current_user_id, current_user_email;
  
  IF current_user_id IS NOT NULL THEN
    -- UPSERTでテストデータを挿入/更新
    INSERT INTO public.users (
      id,
      email,
      display_name,
      pokepoke_id,
      name,
      avatar_url,
      is_admin,
      created_at,
      updated_at
    ) VALUES (
      current_user_id,
      current_user_email,
      'テストユーザー',
      'test-pokepoke-id',
      'Test User',
      null,
      false,
      NOW(),
      NOW()
    )
    ON CONFLICT (id) 
    DO UPDATE SET
      display_name = EXCLUDED.display_name,
      pokepoke_id = EXCLUDED.pokepoke_id,
      updated_at = NOW();
    
    RAISE NOTICE 'Test data inserted/updated for user: %', current_user_id;
  ELSE
    RAISE NOTICE 'No authenticated user found';
  END IF;
END $$;

-- 結果を確認
SELECT 
  id,
  email,
  display_name,
  pokepoke_id,
  created_at,
  updated_at
FROM public.users 
WHERE id = auth.uid();
