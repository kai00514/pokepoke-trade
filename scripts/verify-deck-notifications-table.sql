-- deck_notifications テーブルの存在確認
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'deck_notifications'
) as table_exists;

-- テーブルが存在する場合、構造を確認
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'deck_notifications'
ORDER BY ordinal_position;
