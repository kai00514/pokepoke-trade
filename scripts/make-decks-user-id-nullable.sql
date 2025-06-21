-- decks テーブルの user_id カラムを nullable に変更
ALTER TABLE decks ALTER COLUMN user_id DROP NOT NULL;

-- 確認用クエリ
SELECT 
    column_name, 
    is_nullable, 
    data_type 
FROM information_schema.columns 
WHERE table_name = 'decks' 
AND column_name = 'user_id';
