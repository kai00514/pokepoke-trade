-- decks テーブル用のコメント数インクリメント関数
CREATE OR REPLACE FUNCTION increment_decks_comment_count(deck_id_input UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE decks 
    SET comment_count = COALESCE(comment_count, 0) + 1
    WHERE id = deck_id_input;
    
    -- デバッグ用ログ
    RAISE NOTICE 'Incremented comment count for deck ID: %', deck_id_input;
END;
$$;

-- 関数をテスト（実際のIDに置き換えてください）
-- SELECT increment_decks_comment_count('9c1aca2e-4334-491d-aeb2-42ba343d0253');
