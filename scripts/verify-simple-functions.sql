-- 新しい関数が正しく作成されたか確認
SELECT 
    routine_name,
    routine_type,
    data_type,
    (SELECT string_agg(parameter_name || ':' || data_type, ', ' ORDER BY ordinal_position)
     FROM information_schema.parameters p 
     WHERE p.specific_name = r.specific_name) as parameters
FROM information_schema.routines r
WHERE routine_schema = 'public' 
AND routine_name IN ('increment_deck_likes', 'decrement_deck_likes', 'increment_deck_favorites', 'decrement_deck_favorites')
ORDER BY routine_name;

-- テスト実行（実際のデッキIDに置き換えてください）
-- SELECT public.increment_deck_likes('your-deck-id-here'::uuid);
