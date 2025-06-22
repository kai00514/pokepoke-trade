-- 既存の関数を削除し、新しい定義で再作成します。
-- もし関数が存在しない場合は、DROP FUNCTION IF EXISTS を使用します。
DROP FUNCTION IF EXISTS public.update_deck_comment_count CASCADE;

CREATE OR REPLACE FUNCTION public.update_deck_comment_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.comment_type = 'deck' THEN
            UPDATE public.decks
            SET comment_count = COALESCE(comment_count, 0) + 1
            WHERE id = NEW.deck_id;
        ELSIF NEW.comment_type = 'deck_page' THEN
            UPDATE public.deck_pages
            SET comment_count = COALESCE(comment_count, 0) + 1
            WHERE id = NEW.deck_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.comment_type = 'deck' THEN
            UPDATE public.decks
            SET comment_count = GREATEST(0, COALESCE(comment_count, 0) - 1)
            WHERE id = OLD.deck_id;
        ELSIF OLD.comment_type = 'deck_page' THEN
            UPDATE public.deck_pages
            SET comment_count = GREATEST(0, COALESCE(comment_count, 0) - 1)
            WHERE id = OLD.deck_id;
        END IF;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- トリガーがまだ存在しない場合は作成します。
-- 既に存在する場合は、この部分はスキップされます。
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_deck_comment_count') THEN
        CREATE TRIGGER trigger_update_deck_comment_count
        AFTER INSERT OR DELETE ON public.deck_comments
        FOR EACH ROW EXECUTE FUNCTION public.update_deck_comment_count();
    END IF;
END
$$;
