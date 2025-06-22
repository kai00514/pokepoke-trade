-- 最近挿入されたトレードコメントを確認
SELECT id, post_id, user_id, content, created_at FROM trade_comments ORDER BY created_at DESC LIMIT 5;

-- 最近挿入されたデッキコメントを確認
SELECT id, deck_id, user_id, content, created_at FROM deck_comments ORDER BY created_at DESC LIMIT 5;
