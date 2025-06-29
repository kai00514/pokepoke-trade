-- テスト用のデッキコメント挿入（ゲストユーザーとして）
-- これにより通知トリガーが発火するはずです

-- まず、既存のデッキIDを確認
SELECT 
  'Available decks for testing' as info,
  d.id,
  d.title,
  d.user_id as owner_id,
  'deck' as type
FROM decks d
WHERE d.user_id IS NOT NULL
LIMIT 3

UNION ALL

SELECT 
  'Available deck_pages for testing' as info,
  dp.id,
  dp.deck_name as title,
  NULL as owner_id,
  'deck_page' as type
FROM deck_pages dp
LIMIT 3;

-- テスト実行前の通知数を確認
SELECT 
  'Notifications before test' as info,
  COUNT(*) as count
FROM deck_notifications;

-- ===== テスト1: deckタイプへのゲストコメント =====
-- 上記で確認したdeckのIDを使用してください（例: 'your-deck-id-here'）
INSERT INTO deck_comments (
  deck_id,
  content,
  user_id,
  user_name,
  comment_type
) VALUES (
  'your-deck-id-here'::UUID,  -- ここを実際のdeckのIDに置き換えてください
  'これはゲストユーザーからのテストコメントです',
  NULL,  -- ゲストユーザー
  'ゲスト',
  'deck'
);

-- ===== テスト2: deck_pageタイプへのゲストコメント =====
-- 上記で確認したdeck_pageのIDを使用してください（例: 'your-deck-page-id-here'）
INSERT INTO deck_comments (
  deck_id,
  content,
  user_id,
  user_name,
  comment_type
) VALUES (
  'your-deck-page-id-here'::UUID,  -- ここを実際のdeck_pageのIDに置き換えてください
  'これはdeck_pageへのゲストコメントです',
  NULL,  -- ゲストユーザー
  'ゲスト',
  'deck_page'
);

-- テスト実行後の通知数を確認
SELECT 
  'Notifications after test' as info,
  COUNT(*) as count
FROM deck_notifications;

-- 新しく作成された通知を確認
SELECT 
  'New notifications' as info,
  user_id,
  type,
  content,
  related_id,
  created_at
FROM deck_notifications
ORDER BY created_at DESC
LIMIT 5;

-- 挿入されたコメントを確認
SELECT 
  'Inserted comments' as info,
  id,
  deck_id,
  user_id,
  user_name,
  comment_type,
  content,
  created_at
FROM deck_comments
ORDER BY created_at DESC
LIMIT 5;
