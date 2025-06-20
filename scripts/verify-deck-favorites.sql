-- deck_favoritesテーブルの構造を確認
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'deck_favorites' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- インデックスを確認
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'deck_favorites' 
AND schemaname = 'public';

-- RLSポリシーを確認
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'deck_favorites' 
AND schemaname = 'public';

-- テーブルが正しく作成されたかを確認
SELECT 'deck_favorites table created successfully' as status
WHERE EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'deck_favorites' 
    AND table_schema = 'public'
);
