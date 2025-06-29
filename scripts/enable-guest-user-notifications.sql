-- 既存のトリガーを一時的に無効化
DROP TRIGGER IF EXISTS trade_comment_notification_trigger ON public.trade_comments;
DROP TRIGGER IF EXISTS deck_comment_notification_trigger ON public.deck_comments;

-- 通知テーブルにゲストユーザー用のカラムを追加
ALTER TABLE public.trade_notifications 
ADD COLUMN IF NOT EXISTS guest_session_id TEXT,
ADD COLUMN IF NOT EXISTS is_guest BOOLEAN DEFAULT FALSE;

ALTER TABLE public.deck_notifications 
ADD COLUMN IF NOT EXISTS guest_session_id TEXT,
ADD COLUMN IF NOT EXISTS is_guest BOOLEAN DEFAULT FALSE;

-- user_idをNULLABLEに変更（ゲストユーザー対応）
ALTER TABLE public.trade_notifications 
ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.deck_notifications 
ALTER COLUMN user_id DROP NOT NULL;

-- ====================================================================================================
-- 改良版 create_trade_comment_notification 関数
-- ====================================================================================================
CREATE OR REPLACE FUNCTION public.create_trade_comment_notification(
  p_post_id UUID,
  p_commenter_user_id UUID,
  p_commenter_name TEXT
)
RETURNS VOID AS $$
DECLARE
  post_owner_id UUID;
  post_title TEXT;
  commenters RECORD;
BEGIN
  RAISE LOG 'create_trade_comment_notification: Started for post_id=%, commenter_user_id=%, commenter_name=%', p_post_id, p_commenter_user_id, p_commenter_name;

  -- 投稿者情報を取得
  SELECT owner_id, title INTO post_owner_id, post_title
  FROM public.trade_posts
  WHERE id = p_post_id;

  RAISE LOG 'create_trade_comment_notification: Post owner_id=%, title=%', post_owner_id, post_title;

  -- 投稿者への通知（登録ユーザーのみ）
  IF post_owner_id IS NOT NULL AND post_owner_id IS DISTINCT FROM p_commenter_user_id THEN
    RAISE LOG 'create_trade_comment_notification: Notifying post owner %', post_owner_id;
    INSERT INTO public.trade_notifications (user_id, type, content, related_id, is_guest)
    VALUES (
      post_owner_id::TEXT,
      'trade_comment',
      p_commenter_name || 'さんがあなたのトレード投稿「' || COALESCE(post_title, 'Unknown') || '」にコメントしました',
      p_post_id,
      FALSE
    );
  END IF;

  -- 同じ投稿にコメントした他のユーザーに通知（登録ユーザーのみ）
  FOR commenters IN
    SELECT DISTINCT user_id, user_name
    FROM public.trade_comments 
    WHERE post_id = p_post_id 
      AND user_id IS NOT NULL
      AND user_id IS DISTINCT FROM p_commenter_user_id
      AND (post_owner_id IS NULL OR user_id IS DISTINCT FROM post_owner_id::TEXT)
  LOOP
    RAISE LOG 'create_trade_comment_notification: Notifying other commenter % (user_id: %)', commenters.user_name, commenters.user_id;
    INSERT INTO public.trade_notifications (user_id, type, content, related_id, is_guest)
    VALUES (
      commenters.user_id,
      'trade_comment_reply',
      p_commenter_name || 'さんがトレード投稿「' || COALESCE(post_title, 'Unknown') || '」にコメントしました',
      p_post_id,
      FALSE
    );
  END LOOP;

EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'create_trade_comment_notification: An error occurred: %', SQLERRM;
    NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ====================================================================================================
-- 改良版 create_deck_comment_notification 関数（ゲストユーザー通知対応）
-- ====================================================================================================
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
  p_commenter_session_id TEXT;
BEGIN
  RAISE LOG 'create_deck_comment_notification: Started for deck_id=%, commenter_user_id=%, commenter_name=%, comment_type=%', p_deck_id, p_commenter_user_id, p_commenter_name, p_comment_type;

  -- ゲストユーザーの場合、セッションIDを生成（簡易版）
  IF p_commenter_user_id IS NULL THEN
    p_commenter_session_id := 'guest_' || extract(epoch from now())::text || '_' || substr(md5(random()::text), 1, 8);
    RAISE LOG 'create_deck_comment_notification: Generated guest session ID: %', p_commenter_session_id;
  END IF;

  IF p_comment_type = 'deck' THEN
    SELECT user_id, title INTO deck_owner_id, deck_title
    FROM public.decks
    WHERE id = p_deck_id;
    RAISE LOG 'create_deck_comment_notification: Deck type is "deck". Owner_id=%, title=%', deck_owner_id, deck_title;
  ELSIF p_comment_type = 'deck_page' THEN
    SELECT deck_name INTO deck_title
    FROM public.deck_pages
    WHERE id = p_deck_id;
    deck_owner_id := NULL;
    RAISE LOG 'create_deck_comment_notification: Deck type is "deck_page". Title=%, owner_id is NULL.', deck_title;
  END IF;

  -- デッキ作成者への通知（登録ユーザーのデッキのみ）
  IF p_comment_type = 'deck' AND deck_owner_id IS NOT NULL AND deck_owner_id IS DISTINCT FROM p_commenter_user_id THEN
    RAISE LOG 'create_deck_comment_notification: Notifying deck owner %', deck_owner_id;
    INSERT INTO public.deck_notifications (user_id, type, content, related_id, is_guest)
    VALUES (
      deck_owner_id::TEXT,
      'deck_comment',
      p_commenter_name || 'さんがあなたのデッキ「' || COALESCE(deck_title, 'Unknown') || '」にコメントしました',
      p_deck_id,
      FALSE
    );
  END IF;

  -- 同じデッキにコメントした他のユーザーに通知（登録ユーザーのみ）
  -- ゲストユーザーへの通知は現在のアーキテクチャでは困難なため、登録ユーザーのみに限定
  FOR commenters IN
    SELECT DISTINCT user_id, user_name
    FROM public.deck_comments 
    WHERE deck_id = p_deck_id 
      AND user_id IS NOT NULL  -- 登録ユーザーのみ
      AND user_id IS DISTINCT FROM p_commenter_user_id
      AND (deck_owner_id IS NULL OR user_id IS DISTINCT FROM deck_owner_id::TEXT)
  LOOP
    RAISE LOG 'create_deck_comment_notification: Notifying other commenter % (user_id: %)', commenters.user_name, commenters.user_id;
    INSERT INTO public.deck_notifications (user_id, type, content, related_id, is_guest)
    VALUES (
      commenters.user_id,
      'deck_comment_reply',
      p_commenter_name || 'さんがデッキ「' || COALESCE(deck_title, 'Unknown') || '」にコメントしました',
      p_deck_id,
      FALSE
    );
  END LOOP;

EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'create_deck_comment_notification: An error occurred: %', SQLERRM;
    NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ====================================================================================================
-- トリガーの再作成
-- ====================================================================================================
CREATE TRIGGER trade_comment_notification_trigger
AFTER INSERT ON public.trade_comments
FOR EACH ROW EXECUTE FUNCTION public.create_trade_comment_notification(
  NEW.post_id,
  NEW.user_id,
  COALESCE(NEW.user_name, '匿名ユーザー')
);

CREATE TRIGGER deck_comment_notification_trigger
AFTER INSERT ON public.deck_comments
FOR EACH ROW EXECUTE FUNCTION public.create_deck_comment_notification(
  NEW.deck_id,
  NEW.user_id,
  COALESCE(NEW.user_name, '匿名ユーザー'),
  NEW.comment_type
);
