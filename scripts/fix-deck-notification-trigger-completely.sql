-- 既存のトリガーを削除
DROP TRIGGER IF EXISTS deck_comment_notification_trigger ON public.deck_comments;

-- 既存の関数をすべて削除（オーバーロードされた関数をすべて削除）
DROP FUNCTION IF EXISTS public.create_deck_comment_notification(uuid, uuid, text);
DROP FUNCTION IF EXISTS public.create_deck_comment_notification(uuid, text, text, text);
DROP FUNCTION IF EXISTS public.create_deck_comment_notification(uuid, uuid, text, text);
DROP FUNCTION IF EXISTS public.trigger_deck_comment_notification();

-- 正しい関数を作成
CREATE OR REPLACE FUNCTION public.create_deck_comment_notification()
RETURNS TRIGGER AS $$
DECLARE
  deck_owner_id TEXT := NULL;
  deck_title TEXT := 'タイトルなし';
  commenters RECORD;
BEGIN
  RAISE LOG 'DECK_NOTIFICATION: === TRIGGER START ===';
  RAISE LOG 'DECK_NOTIFICATION: deck_id=%, user_id=%, user_name=%, comment_type=%', 
    NEW.deck_id, NEW.user_id, NEW.user_name, NEW.comment_type;

  -- デッキ情報を取得
  IF NEW.comment_type = 'deck' THEN
    RAISE LOG 'DECK_NOTIFICATION: Querying decks table for deck_id=%', NEW.deck_id;
    SELECT user_id::TEXT, title INTO deck_owner_id, deck_title
    FROM decks 
    WHERE id = NEW.deck_id;
    RAISE LOG 'DECK_NOTIFICATION: Found deck owner_id=%, title=%', deck_owner_id, deck_title;
  ELSIF NEW.comment_type = 'deck_page' THEN
    RAISE LOG 'DECK_NOTIFICATION: Querying deck_pages table for deck_id=%', NEW.deck_id;
    SELECT deck_name INTO deck_title
    FROM deck_pages 
    WHERE id = NEW.deck_id;
    deck_owner_id := NULL; -- deck_pagesには所有者がいない
    RAISE LOG 'DECK_NOTIFICATION: Found deck_page title=%, owner_id set to NULL', deck_title;
  END IF;

  -- デッキ作成者に通知（ユーザー作成デッキの場合のみ、自分のコメントは除く）
  IF NEW.comment_type = 'deck' AND deck_owner_id IS NOT NULL AND deck_owner_id IS DISTINCT FROM NEW.user_id::TEXT THEN
    RAISE LOG 'DECK_NOTIFICATION: Attempting to notify deck owner %', deck_owner_id;
    
    BEGIN
      INSERT INTO deck_notifications (user_id, type, content, related_id)
      VALUES (
        deck_owner_id,
        'deck_comment',
        COALESCE(NEW.user_name, '匿名ユーザー') || 'さんがあなたのデッキ「' || COALESCE(deck_title, 'タイトルなし') || '」にコメントしました',
        NEW.deck_id
      );
      RAISE LOG 'DECK_NOTIFICATION: Successfully notified deck owner %', deck_owner_id;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE LOG 'DECK_NOTIFICATION: ERROR notifying deck owner: %', SQLERRM;
    END;
  ELSE
    RAISE LOG 'DECK_NOTIFICATION: NOT notifying deck owner. comment_type=%, owner_id=%, is_distinct=%', 
      NEW.comment_type, deck_owner_id, (deck_owner_id IS DISTINCT FROM NEW.user_id::TEXT);
  END IF;

  -- 同じデッキにコメントした他の会員ユーザーに通知
  RAISE LOG 'DECK_NOTIFICATION: Searching for other commenters to notify...';
  FOR commenters IN
    SELECT DISTINCT user_id, user_name
    FROM deck_comments 
    WHERE deck_id = NEW.deck_id 
      AND user_id IS NOT NULL  -- 会員ユーザーのみ
      AND user_id IS DISTINCT FROM NEW.user_id  -- コメント投稿者自身は除く
      AND (deck_owner_id IS NULL OR user_id::TEXT IS DISTINCT FROM deck_owner_id)  -- デッキ作成者は除く
  LOOP
    RAISE LOG 'DECK_NOTIFICATION: Attempting to notify other commenter % (user_id: %)', commenters.user_name, commenters.user_id;
    
    BEGIN
      INSERT INTO deck_notifications (user_id, type, content, related_id)
      VALUES (
        commenters.user_id::TEXT,
        'deck_comment_reply',
        COALESCE(NEW.user_name, '匿名ユーザー') || 'さんがデッキ「' || COALESCE(deck_title, 'タイトルなし') || '」にコメントしました',
        NEW.deck_id
      );
      RAISE LOG 'DECK_NOTIFICATION: Successfully notified other commenter %', commenters.user_id;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE LOG 'DECK_NOTIFICATION: ERROR notifying other commenter %: %', commenters.user_id, SQLERRM;
    END;
  END LOOP;

  RAISE LOG 'DECK_NOTIFICATION: === TRIGGER END ===';
  RETURN NEW;

EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'DECK_NOTIFICATION: FATAL ERROR in trigger: %', SQLERRM;
    RETURN NEW; -- エラーが発生してもコメント挿入は成功させる
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 正しいトリガーを作成
CREATE TRIGGER deck_comment_notification_trigger
AFTER INSERT ON public.deck_comments
FOR EACH ROW EXECUTE FUNCTION public.create_deck_comment_notification();

RAISE LOG 'DECK_NOTIFICATION: Trigger recreated successfully';
