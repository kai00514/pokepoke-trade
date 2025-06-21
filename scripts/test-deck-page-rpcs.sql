-- テスト用: 最初のdeck_pageのIDを取得してテスト実行
DO $$
DECLARE
    test_deck_page_id uuid;
    initial_like_count integer;
    initial_favorite_count integer;
    after_increment_like_count integer;
    after_increment_favorite_count integer;
BEGIN
    -- テスト用のdeck_page_idを取得
    SELECT id INTO test_deck_page_id 
    FROM public.deck_pages 
    ORDER BY updated_at DESC 
    LIMIT 1;
    
    IF test_deck_page_id IS NULL THEN
        RAISE NOTICE 'No deck_pages found for testing';
        RETURN;
    END IF;
    
    -- 初期値を取得
    SELECT like_count, favorite_count 
    INTO initial_like_count, initial_favorite_count
    FROM public.deck_pages 
    WHERE id = test_deck_page_id;
    
    RAISE NOTICE 'Testing with deck_page_id: %', test_deck_page_id;
    RAISE NOTICE 'Initial like_count: %, favorite_count: %', initial_like_count, initial_favorite_count;
    
    -- いいね数を増やすテスト
    PERFORM public.increment_deck_page_likes(test_deck_page_id);
    
    -- お気に入り数を増やすテスト
    PERFORM public.increment_deck_page_favorites(test_deck_page_id);
    
    -- 結果を確認
    SELECT like_count, favorite_count 
    INTO after_increment_like_count, after_increment_favorite_count
    FROM public.deck_pages 
    WHERE id = test_deck_page_id;
    
    RAISE NOTICE 'After increment - like_count: %, favorite_count: %', after_increment_like_count, after_increment_favorite_count;
    
    -- 元に戻す
    PERFORM public.decrement_deck_page_likes(test_deck_page_id);
    PERFORM public.decrement_deck_page_favorites(test_deck_page_id);
    
    RAISE NOTICE 'Test completed successfully';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Test failed with error: %', SQLERRM;
END $$;
