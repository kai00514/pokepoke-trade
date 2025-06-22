-- decks テーブルの構造を確認
\d decks;

-- decks テーブルのデータを確認
SELECT id, title, created_at 
FROM decks 
ORDER BY created_at DESC 
LIMIT 10;

-- 特定のIDが存在するかを確認（エラーで出ていたID）
SELECT id, title 
FROM decks 
WHERE id = '9c1aca2e-4334-491d-aeb2-42ba343d0253';

-- deck_pages テーブルでも同じIDを確認
SELECT id, title 
FROM deck_pages 
WHERE id = '9c1aca2e-4334-491d-aeb2-42ba343d0253';

-- decks テーブルと deck_pages テーブルの関係を確認
SELECT 
    'decks' as source_table,
    COUNT(*) as total_count
FROM decks
UNION ALL
SELECT 
    'deck_pages' as source_table,
    COUNT(*) as total_count
FROM deck_pages;
