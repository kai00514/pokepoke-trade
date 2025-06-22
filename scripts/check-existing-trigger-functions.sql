-- 既存のトリガー関数の定義を確認
SELECT 
  routine_name,
  routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('trigger_trade_comment_notification', 'trigger_deck_comment_notification');

-- トリガーの詳細確認
SELECT 
  trigger_name,
  event_object_table,
  action_statement,
  action_timing,
  event_manipulation
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
  AND trigger_name IN ('trade_comment_notification_trigger', 'deck_comment_notification_trigger');
