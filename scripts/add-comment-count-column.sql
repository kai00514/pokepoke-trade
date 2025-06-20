-- decks テーブルに comment_count カラムを追加
ALTER TABLE public.decks 
ADD COLUMN IF NOT EXISTS comment_count INTEGER DEFAULT 0;

-- 既存のデッキのコメント数を計算して更新
UPDATE public.decks 
SET comment_count = (
  SELECT COUNT(*) 
  FROM public.deck_comments 
  WHERE deck_comments.deck_id = decks.id
);

-- コメント数更新用のトリガー関数を作成
CREATE OR REPLACE FUNCTION update_deck_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.decks 
    SET comment_count = comment_count + 1 
    WHERE id = NEW.deck_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.decks 
    SET comment_count = GREATEST(comment_count - 1, 0) 
    WHERE id = OLD.deck_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- トリガーを作成（既存のトリガーがあれば削除してから作成）
DROP TRIGGER IF EXISTS trigger_update_deck_comment_count ON public.deck_comments;
CREATE TRIGGER trigger_update_deck_comment_count
  AFTER INSERT OR DELETE ON public.deck_comments
  FOR EACH ROW EXECUTE FUNCTION update_deck_comment_count();
