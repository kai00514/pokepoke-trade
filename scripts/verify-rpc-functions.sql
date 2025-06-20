-- RPC関数の存在を確認
SELECT 
    routine_name,
    routine_type,
    data_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
    'increment_deck_likes',
    'decrement_deck_likes', 
    'increment_deck_favorites',
    'decrement_deck_favorites'
)
ORDER BY routine_name;

-- decksテーブルの構造を確認
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'decks' 
AND table_schema = 'public'
AND column_name IN ('like_count', 'favorite_count')
ORDER BY column_name;
