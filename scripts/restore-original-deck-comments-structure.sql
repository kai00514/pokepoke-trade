-- comment_type カラムを削除（追加していた場合）
ALTER TABLE deck_comments 
DROP COLUMN IF EXISTS comment_type;

-- 既存の外部キー制約を削除（存在する場合）
ALTER TABLE deck_comments 
DROP CONSTRAINT IF EXISTS deck_comments_deck_id_fkey;

-- 元の外部キー制約を復元（decks テーブルを参照）
ALTER TABLE deck_comments 
ADD CONSTRAINT deck_comments_deck_id_fkey 
FOREIGN KEY (deck_id) REFERENCES decks(id) ON DELETE CASCADE;

-- インデックスを確認・作成
CREATE INDEX IF NOT EXISTS idx_deck_comments_deck_id ON deck_comments(deck_id);
CREATE INDEX IF NOT EXISTS idx_deck_comments_created_at ON deck_comments(created_at);

-- 結果を確認
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
