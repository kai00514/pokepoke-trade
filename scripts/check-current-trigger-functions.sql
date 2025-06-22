-- 現在のトリガー関数の定義を確認
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public' 
  AND routine_name IN ('trigger_trade_comment_notification', 'trigger_deck_comment_notification')
ORDER BY routine_name;
