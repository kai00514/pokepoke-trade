-- 最新のトレードコメントを確認
SELECT 
    'trade_comments' as table_name,
    id, 
    post_id, 
    user_id, 
    user_name,
    is_guest,
    content,
    created_at
FROM trade_comments 
ORDER BY created_at DESC 
LIMIT 3

UNION ALL

-- 最新のデッキコメントを確認
SELECT 
    'deck_comments' as table_name,
    id, 
    deck_id as post_id, 
    user_id::TEXT as user_id, 
    user_name,
    NULL as is_guest,
    content,
    created_at
FROM deck_comments 
ORDER BY created_at DESC 
LIMIT 3

ORDER BY created_at DESC;
