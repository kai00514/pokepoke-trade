-- deck_pagesテーブルの構造を確認
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'deck_pages' 
AND table_schema = 'public'
AND column_name IN ('like_count', 'favorite_count')
ORDER BY column_name;

-- RPC関数が存在するかを確認
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
    'increment_deck_page_likes',
    'decrement_deck_page_likes', 
    'increment_deck_page_favorites',
    'decrement_deck_page_favorites'
)
ORDER BY routine_name;

-- deck_pagesテーブルのサンプルデータを確認（最初の5件）
SELECT id, title, deck_name, like_count, favorite_count, view_count, comment_count
FROM public.deck_pages
ORDER BY updated_at DESC
LIMIT 5;
