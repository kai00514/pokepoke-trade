-- 1. deck_comments テーブルの外部キー制約を確認
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM
    information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name='deck_comments';

-- 2. deck_comments テーブルの構造を確認
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'deck_comments' 
ORDER BY ordinal_position;

-- 3. decks テーブルの構造を確認
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'decks' 
ORDER BY ordinal_position;

-- 4. 関連する関数の存在確認
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_name IN (
    'update_deck_comment_count',
    'trigger_deck_comment_notification',
    'create_deck_comment_notification'
)
ORDER BY routine_name;

-- 5. トリガーの確認
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'deck_comments';

-- 6. サンプルデータの確認
SELECT 
    'decks' as table_name,
    COUNT(*) as record_count
FROM decks
UNION ALL
SELECT 
    'deck_comments' as table_name,
    COUNT(*) as record_count
FROM deck_comments;

-- 7. 特定のデッキIDでのデータ確認（エラーで出ていたID）
SELECT 
    'decks' as source,
    id,
    title,
    comment_count
FROM decks 
WHERE id = '9c1aca2e-4334-491d-aeb2-42ba343d0253'
UNION ALL
SELECT 
    'deck_pages' as source,
    id,
    title,
    comment_count
FROM deck_pages 
WHERE id = '9c1aca2e-4334-491d-aeb2-42ba343d0253';
