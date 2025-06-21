-- deck_pagesのお気に入り数を増やす関数
CREATE OR REPLACE FUNCTION public.increment_deck_page_favorites(deck_page_id_input uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.deck_pages
  SET favorite_count = COALESCE(favorite_count, 0) + 1
  WHERE id = deck_page_id_input;
END;
$$;

-- deck_pagesのお気に入り数を減らす関数
CREATE OR REPLACE FUNCTION public.decrement_deck_page_favorites(deck_page_id_input uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.deck_pages
  SET favorite_count = GREATEST(0, COALESCE(favorite_count, 0) - 1)
  WHERE id = deck_page_id_input;
END;
$$;
