-- 既存の誤った外部キー制約を削除
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'deck_comments_deck_id_fkey' AND conrelid = 'public.deck_comments'::regclass) THEN
        ALTER TABLE public.deck_comments DROP CONSTRAINT deck_comments_deck_id_fkey;
        RAISE NOTICE 'Constraint deck_comments_deck_id_fkey dropped.';
    ELSE
        RAISE NOTICE 'Constraint deck_comments_deck_id_fkey does not exist, skipping drop.';
    END IF;
END
$$;
