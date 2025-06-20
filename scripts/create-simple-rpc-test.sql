-- まず、シンプルな関数から始める
CREATE OR REPLACE FUNCTION public.increment_deck_likes(deck_id_input uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result_count integer;
BEGIN
    -- デバッグ情報をログに出力
    RAISE NOTICE 'Function called with deck_id: %', deck_id_input;
    
    -- decksテーブルを更新
    UPDATE public.decks
    SET like_count = COALESCE(like_count, 0) + 1
    WHERE id = deck_id_input;
    
    -- 更新された行数を確認
    GET DIAGNOSTICS result_count = ROW_COUNT;
    RAISE NOTICE 'Updated % rows', result_count;
    
    -- 更新後の値を取得
    SELECT COALESCE(like_count, 0) INTO result_count
    FROM public.decks
    WHERE id = deck_id_input;
    
    -- 結果を返す
    RETURN json_build_object(
        'success', true,
        'new_count', result_count,
        'deck_id', deck_id_input
    );
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error occurred: %', SQLERRM;
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$;

-- 権限を設定
GRANT EXECUTE ON FUNCTION public.increment_deck_likes(uuid) TO anon, authenticated;
