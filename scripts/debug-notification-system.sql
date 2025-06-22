-- 1. トリガーの状態を確認
SELECT 
    tgname AS trigger_name,
    relname AS table_name,
    tgenabled AS status,
    CASE tgenabled 
        WHEN 'O' THEN 'Enabled'
        WHEN 'D' THEN 'Disabled'
        ELSE 'Other'
    END AS status_description
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE relname = 'trade_comments'
  AND tgname = 'trade_comment_notification_trigger';

-- 2. 最近のトレードコメントを確認
SELECT 
    id, 
    post_id, 
    user_id, 
    user_name,
    is_guest,
    created_at
FROM trade_comments 
ORDER BY created_at DESC 
LIMIT 5;

-- 3. trade_posts テーブルの構造と最近のデータを確認
SELECT 
    id,
    owner_id,
    title,
    is_authenticated,
    created_at
FROM trade_posts 
ORDER BY created_at DESC 
LIMIT 5;

-- 4. trade_notifications テーブルの存在と構造を確認
SELECT COUNT(*) as notification_count FROM trade_notifications;

-- 5. トリガー関数の存在を確認
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public' 
  AND routine_name IN ('trigger_trade_comment_notification', 'create_trade_comment_notification');
