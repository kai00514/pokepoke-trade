-- 既存のトリガーを削除し、新しい定義で再作成します。
DROP TRIGGER IF EXISTS deck_comment_notification_trigger ON public.deck_comments CASCADE;

CREATE TRIGGER deck_comment_notification_trigger
AFTER INSERT ON public.deck_comments
FOR EACH ROW
EXECUTE FUNCTION public.create_deck_comment_notification(
    NEW.deck_id,
    NEW.user_id::TEXT, -- user_idがTEXT型なのでキャスト
    NEW.content,
    NEW.comment_type -- comment_typeを渡す
);
