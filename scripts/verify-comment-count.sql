-- decks テーブルの構造を確認
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'decks' AND table_schema = 'public'
ORDER BY ordinal_position;

-- コメント数の確認
SELECT 
  d.id,
  d.title,
  d.comment_count as stored_comment_count,
  (SELECT COUNT(*) FROM deck_comments WHERE deck_id = d.id) as actual_comment_count
FROM decks d
LIMIT 5;

-- トリガーの確認
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers 
WHERE event_object_table = 'deck_comments';
