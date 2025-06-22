-- decks テーブルの構造を確認
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'decks' 
ORDER BY ordinal_position;

-- deck_pages テーブルの構造を確認
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_definition
FROM information_schema.columns 
WHERE table_name = 'deck_pages' 
ORDER BY ordinal_position;

-- 実際のデッキIDがどちらのテーブルに存在するかを確認
SELECT 'decks' as table_name, id, title FROM decks LIMIT 5;
SELECT 'deck_pages' as table_name, id, title FROM deck_pages LIMIT 5;

-- 特定のIDがどちらのテーブルに存在するかを確認
SELECT 'decks' as source, count(*) as count FROM decks WHERE id = '9c1aca2e-4334-491d-aeb2-42ba343d0253'
UNION ALL
SELECT 'deck_pages' as source, count(*) as count FROM deck_pages WHERE id = '9c1aca2e-4334-491d-aeb2-42ba343d0253';
