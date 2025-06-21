-- deck_pagesのいいね数を増やす関数
CREATE OR REPLACE FUNCTION public.increment_deck_page_likes(deck_page_id_input uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.deck_pages
  SET like_count = COALESCE(like_count, 0) + 1
  WHERE id = deck_page_id_input;
END;
$$;

-- deck_pagesのいいね数を減らす関数
CREATE OR REPLACE FUNCTION public.decrement_deck_page_likes(deck_page_id_input uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.deck_pages
  SET like_count = GREATEST(0, COALESCE(like_count, 0) - 1)
  WHERE id = deck_page_id_input;
END;
$$;
