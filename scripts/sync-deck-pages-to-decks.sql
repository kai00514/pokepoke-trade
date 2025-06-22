-- deck_pages のデータを decks テーブルに挿入（重複を避ける）
INSERT INTO decks (id, title, description, created_at, updated_at, user_id)
SELECT 
    dp.id,
    dp.title,
    dp.description,
    dp.created_at,
    dp.updated_at,
    dp.user_id
FROM deck_pages dp
WHERE NOT EXISTS (
    SELECT 1 FROM decks d WHERE d.id = dp.id
);

-- 結果を確認
SELECT 
    'Before sync - decks' as info,
    COUNT(*) as count
FROM decks
UNION ALL
SELECT 
    'After sync - deck_pages' as info,
    COUNT(*) as count
FROM deck_pages;

-- 特定のIDが decks テーブルに存在するかを再確認
SELECT id, title 
FROM decks 
WHERE id = '9c1aca2e-4334-491d-aeb2-42ba343d0253';
