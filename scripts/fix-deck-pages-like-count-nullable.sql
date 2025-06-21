-- deck_pagesテーブルのlike_countカラムをNOT NULLに設定し、既存のNULL値を0に更新
DO $$
BEGIN
    -- 既存のNULL値を0に更新
    UPDATE public.deck_pages
    SET like_count = 0
    WHERE like_count IS NULL;

    -- like_countカラムをNOT NULLに設定
    ALTER TABLE public.deck_pages
    ALTER COLUMN like_count SET NOT NULL;
END $$;
