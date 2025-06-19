-- increment_deck_likes 関数
CREATE OR REPLACE FUNCTION public.increment_deck_likes(deck_id_input uuid)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.decks
  SET like_count = like_count + 1
  WHERE id = deck_id_input;
END;
$$;

-- decrement_deck_likes 関数
CREATE OR REPLACE FUNCTION public.decrement_deck_likes(deck_id_input uuid)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.decks
  SET like_count = GREATEST(0, like_count - 1)
  WHERE id = deck_id_input;
END;
$$;

-- increment_deck_favorites 関数
CREATE OR REPLACE FUNCTION public.increment_deck_favorites(deck_id_input uuid)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.decks
  SET favorite_count = favorite_count + 1
  WHERE id = deck_id_input;
END;
$$;

-- decrement_deck_favorites 関数
CREATE OR REPLACE FUNCTION public.decrement_deck_favorites(deck_id_input uuid)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.decks
  SET favorite_count = GREATEST(0, favorite_count - 1)
  WHERE id = deck_id_input;
END;
$$;
