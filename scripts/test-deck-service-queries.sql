-- deck-service.ts の getDeckById が実際にどのテーブルを使用しているかをテスト

-- 1. decks テーブルから特定のIDを検索
SELECT 
    id,
    title,
    description,
    user_id,
    like_count,
    favorite_count,
    comment_count,
    created_at
FROM decks 
WHERE id = '9c1aca2e-4334-491d-aeb2-42ba343d0253';

-- 2. deck_pages テーブルから同じIDを検索
SELECT 
    id,
    title,
    description,
    user_id,
    like_count,
    favorite_count,
    comment_count,
    created_at
FROM deck_pages 
WHERE id = '9c1aca2e-4334-491d-aeb2-42ba343d0253';

-- 3. deck_comments テーブルでこのIDに関連するコメントを確認
SELECT 
    id,
    deck_id,
    user_id,
    user_name,
    content,
    comment_type,
    created_at
FROM deck_comments 
WHERE deck_id = '9c1aca2e-4334-491d-aeb2-42ba343d0253'
ORDER BY created_at;

-- 4. 両テーブルのIDの重複状況を確認
SELECT 
    d.id as deck_id,
    dp.id as deck_page_id,
    d.title as deck_title,
    dp.title as deck_page_title
FROM decks d
FULL OUTER JOIN deck_pages dp ON d.id = dp.id
WHERE d.id IS NULL OR dp.id IS NULL
LIMIT 10;
