-- 既存の関数を削除（存在する場合）
DROP FUNCTION IF EXISTS public.increment_deck_likes(uuid);
DROP FUNCTION IF EXISTS public.decrement_deck_likes(uuid);
DROP FUNCTION IF EXISTS public.increment_deck_favorites(uuid);
DROP FUNCTION IF EXISTS public.decrement_deck_favorites(uuid);

-- increment_deck_likes 関数を作成
CREATE OR REPLACE FUNCTION public.increment_deck_likes(deck_id_input uuid)
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.decks
  SET like_count = COALESCE(like_count, 0) + 1
  WHERE id = deck_id_input;
  
  -- デバッグ用：更新された行数をログに出力
  IF NOT FOUND THEN
    RAISE NOTICE 'No deck found with id: %', deck_id_input;
  END IF;
END;
$$;

-- decrement_deck_likes 関数を作成
CREATE OR REPLACE FUNCTION public.decrement_deck_likes(deck_id_input uuid)
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.decks
  SET like_count = GREATEST(0, COALESCE(like_count, 0) - 1)
  WHERE id = deck_id_input;
  
  -- デバッグ用：更新された行数をログに出力
  IF NOT FOUND THEN
    RAISE NOTICE 'No deck found with id: %', deck_id_input;
  END IF;
END;
$$;

-- increment_deck_favorites 関数を作成
CREATE OR REPLACE FUNCTION public.increment_deck_favorites(deck_id_input uuid)
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.decks
  SET favorite_count = COALESCE(favorite_count, 0) + 1
  WHERE id = deck_id_input;
  
  -- デバッグ用：更新された行数をログに出力
  IF NOT FOUND THEN
    RAISE NOTICE 'No deck found with id: %', deck_id_input;
  END IF;
END;
$$;

-- decrement_deck_favorites 関数を作成
CREATE OR REPLACE FUNCTION public.decrement_deck_favorites(deck_id_input uuid)
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.decks
  SET favorite_count = GREATEST(0, COALESCE(favorite_count, 0) - 1)
  WHERE id = deck_id_input;
  
  -- デバッグ用：更新された行数をログに出力
  IF NOT FOUND THEN
    RAISE NOTICE 'No deck found with id: %', deck_id_input;
  END IF;
END;
$$;

-- 関数の権限を設定
GRANT EXECUTE ON FUNCTION public.increment_deck_likes(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_deck_likes(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_deck_favorites(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_deck_favorites(uuid) TO anon, authenticated;
