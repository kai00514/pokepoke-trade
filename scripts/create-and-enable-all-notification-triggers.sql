-- 通知を生成する関数を再作成（デバッグログとエラーハンドリングを含む）
CREATE OR REPLACE FUNCTION public.create_trade_comment_notification(
  p_post_id UUID,
  p_commenter_user_id TEXT,
  p_commenter_name TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- この関数はトリガーから呼び出されるため、定義者の権限で実行
AS $$
DECLARE
  post_owner_id TEXT;
  post_title TEXT;
  commenters RECORD;
BEGIN
  RAISE NOTICE 'create_trade_comment_notification: Start for post_id=%, commenter_user_id=%', p_post_id, p_commenter_user_id;

  -- 投稿者の情報を取得
  SELECT user_id, title INTO post_owner_id, post_title
  FROM trade_posts 
  WHERE id = p_post_id;
  
  RAISE NOTICE 'create_trade_comment_notification: Post owner_id=%, post_title=%', post_owner_id, post_title;

  -- 投稿者に通知（自分のコメントは除く）
  IF post_owner_id IS NOT NULL AND post_owner_id != p_commenter_user_id THEN
    BEGIN
      INSERT INTO trade_notifications (user_id, type, content, related_id)
      VALUES (
        post_owner_id,
        'trade_comment',
        p_commenter_name || 'さんがあなたのトレード投稿「' || post_title || '」にコメントしました',
        p_post_id
      );
      RAISE NOTICE 'create_trade_comment_notification: Notification inserted for post owner %', post_owner_id;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING 'create_trade_comment_notification: Error inserting notification for post owner: %', SQLERRM;
    END;
  ELSE
    RAISE NOTICE 'create_trade_comment_notification: Not notifying post owner (owner is null or is commenter).';
  END IF;
  
  -- 同じ投稿にコメントした他のユーザーに通知
  FOR commenters IN
    SELECT DISTINCT user_id, user_name
    FROM trade_comments 
    WHERE post_id = p_post_id 
      AND user_id IS NOT NULL 
      AND user_id != p_commenter_user_id 
      AND user_id != post_owner_id -- 投稿者と現在のコメント者を除く
  LOOP
    BEGIN
      INSERT INTO trade_notifications (user_id, type, content, related_id)
      VALUES (
        commenters.user_id,
        'trade_comment_reply',
        p_commenter_name || 'さんがトレード投稿「' || post_title || '」にコメントしました',
        p_post_id
      );
      RAISE NOTICE 'create_trade_comment_notification: Notification inserted for other commenter %', commenters.user_id;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING 'create_trade_comment_notification: Error inserting notification for other commenter %: %', commenters.user_id, SQLERRM;
    END;
  END LOOP;
  RAISE NOTICE 'create_trade_comment_notification: End.';
END;
$$;

-- デッキ投稿のコメント通知を作成する関数を再作成
CREATE OR REPLACE FUNCTION public.create_deck_comment_notification(
  p_deck_id UUID,
  p_commenter_user_id TEXT,
  p_commenter_name TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deck_owner_id TEXT;
  deck_name TEXT;
  commenters RECORD;
BEGIN
  RAISE NOTICE 'create_deck_comment_notification: Start for deck_id=%, commenter_user_id=%', p_deck_id, p_commenter_user_id;

  -- デッキ投稿者の情報を取得
  SELECT user_id, deck_name INTO deck_owner_id, deck_name
  FROM deck_pages 
  WHERE id = p_deck_id;
  
  RAISE NOTICE 'create_deck_comment_notification: Deck owner_id=%, deck_name=%', deck_owner_id, deck_name;

  -- 投稿者に通知（自分のコメントは除く）
  IF deck_owner_id IS NOT NULL AND deck_owner_id != p_commenter_user_id THEN
    BEGIN
      INSERT INTO deck_notifications (user_id, type, content, related_id)
      VALUES (
        deck_owner_id,
        'deck_comment',
        p_commenter_name || 'さんがあなたのデッキ「' || deck_name || '」にコメントしました',
        p_deck_id
      );
      RAISE NOTICE 'create_deck_comment_notification: Notification inserted for deck owner %', deck_owner_id;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING 'create_deck_comment_notification: Error inserting notification for deck owner: %', SQLERRM;
    END;
  ELSE
    RAISE NOTICE 'create_deck_comment_notification: Not notifying deck owner (owner is null or is commenter).';
  END IF;
  
  -- 同じデッキにコメントした他のユーザーに通知
  FOR commenters IN
    SELECT DISTINCT user_id, user_name
    FROM deck_comments 
    WHERE deck_id = p_deck_id 
      AND user_id IS NOT NULL 
      AND user_id != p_commenter_user_id 
      AND user_id != deck_owner_id -- 投稿者と現在のコメント者を除く
  LOOP
    BEGIN
      INSERT INTO deck_notifications (user_id, type, content, related_id)
      VALUES (
        commenters.user_id,
        'deck_comment_reply',
        p_commenter_name || 'さんがデッキ「' || deck_name || '」にコメントしました',
        p_deck_id
      );
      RAISE NOTICE 'create_deck_comment_notification: Notification inserted for other commenter %', commenters.user_id;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING 'create_deck_comment_notification: Error inserting notification for other commenter %: %', commenters.user_id, SQLERRM;
    END;
  END LOOP;
  RAISE NOTICE 'create_deck_comment_notification: End.';
END;
$$;

-- トリガー関数を再作成
CREATE OR REPLACE FUNCTION public.trigger_trade_comment_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RAISE NOTICE 'trigger_trade_comment_notification: Trigger fired for NEW.user_id=%', NEW.user_id;
  -- ゲストユーザーのコメントは通知しない
  IF NEW.user_id IS NOT NULL THEN
    PERFORM public.create_trade_comment_notification(
      NEW.post_id,
      NEW.user_id,
      COALESCE(NEW.user_name, '匿名ユーザー')
    );
    RAISE NOTICE 'trigger_trade_comment_notification: create_trade_comment_notification called.';
  ELSE
    RAISE NOTICE 'trigger_trade_comment_notification: Not calling notification function for guest user.';
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'trigger_trade_comment_notification: Error in trigger: %', SQLERRM;
    RETURN NEW; -- エラーが発生しても挿入処理は続行
END;
$$;

CREATE OR REPLACE FUNCTION public.trigger_deck_comment_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RAISE NOTICE 'trigger_deck_comment_notification: Trigger fired for NEW.user_id=%', NEW.user_id;
  -- ゲストユーザーのコメントは通知しない
  IF NEW.user_id IS NOT NULL THEN
    PERFORM public.create_deck_comment_notification(
      NEW.deck_id::UUID,
      NEW.user_id,
      COALESCE(NEW.user_name, '匿名ユーザー')
    );
    RAISE NOTICE 'trigger_deck_comment_notification: create_deck_comment_notification called.';
  ELSE
    RAISE NOTICE 'trigger_deck_comment_notification: Not calling notification function for guest user.';
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'trigger_deck_comment_notification: Error in trigger: %', SQLERRM;
    RETURN NEW; -- エラーが発生しても挿入処理は続行
END;
$$;

-- トリガーを再作成
-- 既存のトリガーを削除（念のため）
DROP TRIGGER IF EXISTS trade_comment_notification_trigger ON trade_comments;
DROP TRIGGER IF EXISTS deck_comment_notification_trigger ON deck_comments;

-- 新しいトリガーを作成
CREATE TRIGGER trade_comment_notification_trigger
  AFTER INSERT ON trade_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_trade_comment_notification();

CREATE TRIGGER deck_comment_notification_trigger
  AFTER INSERT ON deck_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_deck_comment_notification();

RAISE NOTICE 'All notification functions and triggers have been recreated and enabled.';
