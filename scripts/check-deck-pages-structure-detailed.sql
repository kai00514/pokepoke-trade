-- deck_pagesテーブルの構造を詳細確認
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'deck_pages' 
    AND table_schema = 'public'
ORDER BY ordinal_position;
