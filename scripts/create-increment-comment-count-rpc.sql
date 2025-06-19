-- public.decks テーブルの comment_count をインクリメントする RPC 関数
CREATE OR REPLACE FUNCTION public.increment_deck_comments_count(deck_id_input uuid)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.decks
  SET comment_count = comment_count + 1
  WHERE id = deck_id_input;
END;
$$;
