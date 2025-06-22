-- 1. trade_comments テーブルのスキーマ詳細
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default 
FROM information_schema.columns 
WHERE table_name = 'trade_comments' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. trade_posts テーブルのスキーマ詳細
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default 
FROM information_schema.columns 
WHERE table_name = 'trade_posts' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. deck_comments テーブルのスキーマ詳細
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default 
FROM information_schema.columns 
WHERE table_name = 'deck_comments' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. deck_pages テーブルのスキーマ詳細
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default 
FROM information_schema.columns 
WHERE table_name = 'deck_pages' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. trade_notifications テーブルのスキーマ詳細
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default 
FROM information_schema.columns 
WHERE table_name = 'trade_notifications' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 6. deck_notifications テーブルのスキーマ詳細
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default 
FROM information_schema.columns 
WHERE table_name = 'deck_notifications' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 7. create_trade_comment_notification 関数を手動でテスト実行
--    (既存の投稿IDとユーザーIDに置き換えてください)
--    例: SELECT public.create_trade_comment_notification('既存のトレード投稿ID', '既存のコメントユーザーID', 'テストユーザー名');
--    もしエラーが発生すれば、そのエラーメッセージを教えてください。
--    エラーが発生しない場合でも、trade_notificationsテーブルにデータが挿入されたか確認してください。
-- SELECT public.create_trade_comment_notification('fb760080-7ade-4094-b50a-3c002558a7ff', 'dba9dfdc-b861-4586-9671-ebb2adae2b90', 'テストユーザー');

-- 8. create_deck_comment_notification 関数を手動でテスト実行
--    (既存のデッキIDとユーザーIDに置き換えてください)
--    例: SELECT public.create_deck_comment_notification('既存のデッキID', '既存のコメントユーザーID', 'テストユーザー名');
-- SELECT public.create_deck_comment_notification('既存のデッキID', '既存のコメントユーザーID', 'テストユーザー名');
