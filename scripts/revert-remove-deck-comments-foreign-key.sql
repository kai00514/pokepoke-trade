-- deck_comments テーブルに外部キー制約を再追加します。
-- これにより、deck_comments.deck_id が public.decks.id を参照するようになります。
ALTER TABLE public.deck_comments
ADD CONSTRAINT deck_comments_deck_id_fkey
FOREIGN KEY (deck_id) REFERENCES public.decks(id) ON DELETE CASCADE;
