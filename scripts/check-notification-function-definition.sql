-- create_deck_comment_notification関数の完全な定義を確認
SELECT 
    routine_name,
    routine_definition,
    data_type,
    routine_body
FROM information_schema.routines 
WHERE routine_name = 'create_deck_comment_notification'
    AND routine_schema = 'public';
