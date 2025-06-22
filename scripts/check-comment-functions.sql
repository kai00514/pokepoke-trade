-- update_deck_comment_count 関数の定義を確認
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'update_deck_comment_count';

-- trigger_deck_comment_notification 関数の定義を確認
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'trigger_deck_comment_notification';

-- create_deck_comment_notification 関数の定義を確認
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'create_deck_comment_notification';
