-- deck_idをNULL許容にする
ALTER TABLE public.deck_favorites
ALTER COLUMN deck_id DROP NOT NULL;

-- deck_page_idカラムを追加
ALTER TABLE public.deck_favorites
ADD COLUMN deck_page_id uuid NULL;

-- deck_pagesテーブルへの外部キー制約を追加
ALTER TABLE public.deck_favorites
ADD CONSTRAINT fk_deck_page
FOREIGN KEY (deck_page_id) REFERENCES public.deck_pages(id);

-- deck_idまたはdeck_page_idの少なくとも一方がNULLでないことを保証するチェック制約を追加
ALTER TABLE public.deck_favorites
ADD CONSTRAINT chk_deck_id_or_deck_page_id
CHECK (deck_id IS NOT NULL OR deck_page_id IS NOT NULL);
