-- 既存の複雑な関数を削除
DROP FUNCTION IF EXISTS public.increment_deck_likes(uuid, uuid);
DROP FUNCTION IF EXISTS public.decrement_deck_likes(uuid, uuid);
DROP FUNCTION IF EXISTS public.increment_deck_favorites(uuid, uuid);
DROP FUNCTION IF EXISTS public.decrement_deck_favorites(uuid, uuid);

-- シンプルな関数を作成（deck_id_inputのみを受け取る）
CREATE OR REPLACE FUNCTION public.increment_deck_likes(deck_id_input uuid)
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.decks
  SET like_count = COALESCE(like_count, 0) + 1
  WHERE id = deck_id_input;
  
  -- デバッグ用ログ
  RAISE NOTICE 'Incremented likes for deck: %', deck_id_input;
END;
$$;

CREATE OR REPLACE FUNCTION public.decrement_deck_likes(deck_id_input uuid)
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.decks
  SET like_count = GREATEST(0, COALESCE(like_count, 0) - 1)
  WHERE id = deck_id_input;
  
  -- デバッグ用ログ
  RAISE NOTICE 'Decremented likes for deck: %', deck_id_input;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_deck_favorites(deck_id_input uuid)
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.decks
  SET favorite_count = COALESCE(favorite_count, 0) + 1
  WHERE id = deck_id_input;
  
  -- デバッグ用ログ
  RAISE NOTICE 'Incremented favorites for deck: %', deck_id_input;
END;
$$;

CREATE OR REPLACE FUNCTION public.decrement_deck_favorites(deck_id_input uuid)
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.decks
  SET favorite_count = GREATEST(0, COALESCE(favorite_count, 0) - 1)
  WHERE id = deck_id_input;
  
  -- デバッグ用ログ
  RAISE NOTICE 'Decremented favorites for deck: %', deck_id_input;
END;
$$;

-- 権限を設定
GRANT EXECUTE ON FUNCTION public.increment_deck_likes(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_deck_likes(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_deck_favorites(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_deck_favorites(uuid) TO anon, authenticated;
