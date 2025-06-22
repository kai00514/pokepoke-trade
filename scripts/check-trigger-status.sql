-- トリガーの有効状態を確認
-- status: O=enabled (有効), D=disabled (無効), R=replica, A=always
SELECT 
    tgname AS trigger_name,
    relname AS table_name,
    pg_catalog.pg_get_triggerdef(t.oid) AS trigger_definition,
    tgenabled AS status 
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE relname IN ('trade_comments', 'deck_comments')
  AND tgname IN ('trade_comment_notification_trigger', 'deck_comment_notification_trigger');
