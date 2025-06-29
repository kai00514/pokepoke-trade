-- ゲストユーザーのコメントに対するトリガー関数の動作確認

-- 1. 該当するdeck_idがdecksテーブルに存在するかを確認
SELECT 'decks table check' as check_type, id, user_id, title, created_at
FROM decks 
WHERE id = '0d84cce4-6b70-4f8f-82d0-7b15d03aeee5';

-- 2. 該当するdeck_idがdeck_pagesテーブルに存在するかを確認
SELECT 'deck_pages table check' as check_type, id, deck_name, created_at
FROM deck_pages 
WHERE id = '0d84cce4-6b70-4f8f-82d0-7b15d03aeee5';

-- 3. 現在のdeck_notificationsテーブルの状態を確認
SELECT 'current notifications' as check_type, count(*) as notification_count
FROM deck_notifications;

-- 4. 最新のdeck_notificationsを確認（もしあれば）
SELECT 'latest notifications' as check_type, *
FROM deck_notifications 
ORDER BY created_at DESC 
LIMIT 5;

-- 5. 該当するdeck_idに対する既存のコメントを確認
SELECT 'existing comments' as check_type, id, user_id, user_name, comment_type, created_at
FROM deck_comments 
WHERE deck_id = '0d84cce4-6b70-4f8f-82d0-7b15d03aeee5'
ORDER BY created_at DESC;

-- 6. トリガー関数を手動で実行してテスト
SELECT 'manual trigger test' as check_type, 
       public.create_deck_comment_notification(
         '0d84cce4-6b70-4f8f-82d0-7b15d03aeee5'::UUID,  -- deck_id
         NULL,                                            -- user_id (ゲストユーザー)
         '匿名ユーザー',                                    -- user_name
         'deck'                                           -- comment_type
       ) as result;

-- 7. 手動実行後のdeck_notificationsテーブルの状態を再確認
SELECT 'notifications after manual test' as check_type, *
FROM deck_notifications 
ORDER BY created_at DESC 
LIMIT 3;
