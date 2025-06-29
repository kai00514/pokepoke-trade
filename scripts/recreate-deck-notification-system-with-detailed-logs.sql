-- 既存のトリガーを削除
DROP TRIGGER IF EXISTS deck_comment_notification_trigger ON public.deck_comments;

-- 詳細ログ付きのデッキ通知関数を作成
CREATE OR REPLACE FUNCTION public.create_deck_comment_notification(
  p_deck_id UUID,
  p_commenter_user_id UUID,
  p_commenter_name TEXT,
  p_comment_type TEXT
)
RETURNS VOID AS $$
DECLARE
  deck_owner_id UUID := NULL;
  deck_title TEXT;
  commenters RECORD;
  notification_count INTEGER := 0;
BEGIN
  RAISE LOG 'DECK_NOTIFICATION: === FUNCTION START ===';
  RAISE LOG 'DECK_NOTIFICATION: deck_id=%, commenter_user_id=%, commenter_name=%, comment_type=%', 
    p_deck_id, p_commenter_user_id, p_commenter_name, p_comment_type;

  -- デッキ情報を取得
  IF p_comment_type = 'deck' THEN
    RAISE LOG 'DECK_NOTIFICATION: Querying decks table for deck_id=%', p_deck_id;
    SELECT user_id, title INTO deck_owner_id, deck_title
    FROM public.decks
    WHERE id = p_deck_id;
    RAISE LOG 'DECK_NOTIFICATION: Found deck owner_id=%, title=%', deck_owner_id, deck_title;
  ELSIF p_comment_type = 'deck_page' THEN
    RAISE LOG 'DECK_NOTIFICATION: Querying deck_pages table for deck_id=%', p_deck_id;
    SELECT deck_name INTO deck_title
    FROM public.deck_pages
    WHERE id = p_deck_id;
    deck_owner_id := NULL;
    RAISE LOG 'DECK_NOTIFICATION: Found deck_page title=%, owner_id set to NULL', deck_title;
  END IF;

  -- デッキ作成者への通知
  IF p_comment_type = 'deck' AND deck_owner_id IS NOT NULL AND deck_owner_id IS DISTINCT FROM p_commenter_user_id THEN
    RAISE LOG 'DECK_NOTIFICATION: Attempting to notify deck owner % (owner != commenter)', deck_owner_id;
    
    BEGIN
      INSERT INTO public.deck_notifications (user_id, type, content, related_id)
      VALUES (
        deck_owner_id::TEXT,
        'deck_comment',
        p_commenter_name || 'さんがあなたのデッキ「' || COALESCE(deck_title, 'Unknown') || '」にコメントしました',
        p_deck_id
      );
      notification_count := notification_count + 1;
      RAISE LOG 'DECK_NOTIFICATION: Successfully notified deck owner %', deck_owner_id;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE LOG 'DECK_NOTIFICATION: ERROR notifying deck owner: %', SQLERRM;
    END;
  ELSE
    RAISE LOG 'DECK_NOTIFICATION: NOT notifying deck owner. Reasons: comment_type=%, owner_id=%, is_distinct=%', 
      p_comment_type, deck_owner_id, (deck_owner_id IS DISTINCT FROM p_commenter_user_id);
  END IF;

  -- 他のコメント投稿者への通知
  RAISE LOG 'DECK_NOTIFICATION: Searching for other commenters to notify...';
  FOR commenters IN
    SELECT DISTINCT user_id, user_name
    FROM public.deck_comments 
    WHERE deck_id = p_deck_id 
      AND user_id IS NOT NULL
      AND user_id IS DISTINCT FROM p_commenter_user_id
      AND (deck_owner_id IS NULL OR user_id IS DISTINCT FROM deck_owner_id::TEXT)
  LOOP
    RAISE LOG 'DECK_NOTIFICATION: Attempting to notify other commenter % (user_id: %)', commenters.user_name, commenters.user_id;
    
    BEGIN
      INSERT INTO public.deck_notifications (user_id, type, content, related_id)
      VALUES (
        commenters.user_id,
        'deck_comment_reply',
        p_commenter_name || 'さんがデッキ「' || COALESCE(deck_title, 'Unknown') || '」にコメントしました',
        p_deck_id
      );
      notification_count := notification_count + 1;
      RAISE LOG 'DECK_NOTIFICATION: Successfully notified other commenter %', commenters.user_id;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE LOG 'DECK_NOTIFICATION: ERROR notifying other commenter %: %', commenters.user_id, SQLERRM;
    END;
  END LOOP;

  RAISE LOG 'DECK_NOTIFICATION: === FUNCTION END === Total notifications sent: %', notification_count;

EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'DECK_NOTIFICATION: FATAL ERROR in function: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- トリガーを再作成
CREATE TRIGGER deck_comment_notification_trigger
AFTER INSERT ON public.deck_comments
FOR EACH ROW EXECUTE FUNCTION public.create_deck_comment_notification(
  NEW.deck_id,
  NEW.user_id,
  COALESCE(NEW.user_name, '匿名ユーザー'),
  NEW.comment_type
);

RAISE LOG 'DECK_NOTIFICATION: Trigger recreated successfully';
