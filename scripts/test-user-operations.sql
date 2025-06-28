-- テスト用のユーザー操作を実行
-- 注意: 実際のユーザーIDに置き換えてください

-- 1. 既存ユーザーの確認
SELECT 
  id,
  name,
  email,
  display_name,
  pokepoke_id,
  avatar_url,
  is_admin
FROM users 
WHERE id = 'test-user-id-here';

-- 2. ポケポケIDの更新テスト
UPDATE users 
SET pokepoke_id = 'test-pokepoke-id-123'
WHERE id = 'test-user-id-here';

-- 3. ユーザー名の更新テスト
UPDATE users 
SET display_name = 'テストユーザー'
WHERE id = 'test-user-id-here';

-- 4. 更新後の確認
SELECT 
  id,
  name,
  email,
  display_name,
  pokepoke_id,
  avatar_url,
  is_admin,
  updated_at
FROM users 
WHERE id = 'test-user-id-here';
