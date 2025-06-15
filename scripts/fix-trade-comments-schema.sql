-- trade_commentsテーブルのuser_idカラムをNULL許可に変更
ALTER TABLE trade_comments ALTER COLUMN user_id DROP NOT NULL;

-- 既存のデータに影響がないことを確認
SELECT COUNT(*) as total_comments FROM trade_comments;
SELECT COUNT(*) as guest_comments FROM trade_comments WHERE user_id IS NULL;

-- インデックスの確認（必要に応じて）
SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'trade_comments';
