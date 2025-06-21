-- deck_pagesテーブルにlike_countとfavorite_countカラムを追加（存在しない場合）
DO $$ 
BEGIN
    -- like_countカラムを追加
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'deck_pages' 
        AND column_name = 'like_count'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.deck_pages ADD COLUMN like_count integer DEFAULT 0 NOT NULL;
    END IF;
    
    -- favorite_countカラムを追加
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'deck_pages' 
        AND column_name = 'favorite_count'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.deck_pages ADD COLUMN favorite_count integer DEFAULT 0 NOT NULL;
    END IF;
END $$;

-- 既存のレコードのNULL値を0に更新
UPDATE public.deck_pages 
SET like_count = 0 
WHERE like_count IS NULL;

UPDATE public.deck_pages 
SET favorite_count = 0 
WHERE favorite_count IS NULL;
