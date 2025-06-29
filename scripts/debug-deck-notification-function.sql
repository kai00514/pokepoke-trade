-- 最新のデッキコメントを確認
SELECT 
  id,
  deck_id,
  user_id,
  user_name,
  content,
  created_at
FROM deck_comments 
ORDER BY created_at DESC 
LIMIT 5;

-- deck_pagesテーブルの構造を確認
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'deck_pages' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- decksテーブルの構造を確認
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'decks' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 実際のデッキデータを確認（deck_pages）
SELECT id, owner_id, user_id, deck_name, title
FROM deck_pages 
LIMIT 5;

-- 実際のデッキデータを確認（decks）
SELECT id, owner_id, user_id, deck_name, title
FROM decks 
LIMIT 5;

-- 手動でトリガー関数を実行してテスト
-- 最新のデッキコメントの情報を使用
DO $$
DECLARE
  latest_comment RECORD;
BEGIN
  -- 最新のデッキコメントを取得
  SELECT deck_id, user_id, user_name 
  INTO latest_comment
  FROM deck_comments 
  WHERE user_id IS NOT NULL
  ORDER BY created_at DESC 
  LIMIT 1;
  
  IF latest_comment IS NOT NULL THEN
    RAISE NOTICE 'Testing with deck_id: %, user_id: %, user_name: %', 
      latest_comment.deck_id, latest_comment.user_id, latest_comment.user_name;
    
    -- 手動でトリガー関数を実行
    PERFORM public.create_deck_comment_notification(
      latest_comment.deck_id,
      latest_comment.user_id,
      latest_comment.user_name
    );
    
    RAISE NOTICE 'Function executed successfully';
  ELSE
    RAISE NOTICE 'No deck comments found with user_id';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error occurred: %', SQLERRM;
END;
$$;

-- 通知テーブルの内容を確認
SELECT * FROM deck_notifications ORDER BY created_at DESC LIMIT 10;
