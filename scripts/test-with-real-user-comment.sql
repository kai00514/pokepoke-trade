-- 会員ユーザーのコメントもテストして比較

-- まず、認証済みユーザーのIDを確認（auth.usersテーブルから）
SELECT 
  'Available authenticated users' as info,
  id,
  email,
  raw_user_meta_data->>'user_name' as user_name
FROM auth.users
LIMIT 3;

-- 会員ユーザーとしてコメントを挿入（比較用）
-- 上記で確認したユーザーIDを使用してください
INSERT INTO deck_comments (
  deck_id,
  content,
  user_id,
  user_name,
  comment_type
) VALUES (
  'your-deck-id-here'::UUID,  -- 実際のdeckのIDに置き換え
  'これは会員ユーザーからのテストコメントです',
  'your-user-id-here'::UUID,  -- 実際のユーザーIDに置き換え
  'テストユーザー',
  'deck'
);

-- 通知が作成されたか確認
SELECT 
  'Latest notifications after member comment' as info,
  user_id,
  type,
  content,
  related_id,
  created_at
FROM deck_notifications
ORDER BY created_at DESC
LIMIT 3;
