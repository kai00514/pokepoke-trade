-- 現在のトリガー関数の定義を確認
SELECT 
  'Current deck comment trigger function' as info,
  routine_name,
  routine_definition
FROM information_schema.routines
WHERE routine_name = 'create_deck_comment_notification'
  AND routine_schema = 'public';

-- トリガーの設定を確認
SELECT 
  'Current deck comment trigger' as info,
  trigger_name,
  event_object_table,
  action_statement,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_name = 'deck_comment_notification_trigger';

-- 関数の詳細な定義を取得（PostgreSQL固有）
SELECT 
  'Function source code' as info,
  pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'create_deck_comment_notification'
  AND n.nspname = 'public';

-- 最近のdeck_commentsの挿入を確認
SELECT 
  'Recent deck comments' as info,
  id,
  deck_id,
  user_id,
  user_name,
  comment_type,
  content,
  created_at
FROM deck_comments
ORDER BY created_at DESC
LIMIT 3;

-- 対応する通知があるか確認
SELECT 
  'Recent deck notifications' as info,
  id,
  user_id,
  type,
  content,
  related_id,
  created_at
FROM deck_notifications
ORDER BY created_at DESC
LIMIT 3;
