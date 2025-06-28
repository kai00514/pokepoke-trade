-- 既存のトリガーを削除 (依存関係を解消するため)
DROP TRIGGER IF EXISTS trade_comment_notification_trigger ON public.trade_comments;
DROP TRIGGER IF EXISTS deck_comment_notification_trigger ON public.deck_comments;

-- 既存の通知関数を削除 (古い引数型と新しい引数型の両方を削除)
DROP FUNCTION IF EXISTS public.create_trade_comment_notification(UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.create_trade_comment_notification(UUID, UUID, TEXT);
DROP FUNCTION IF EXISTS public.create_deck_comment_notification(UUID, UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.create_deck_comment_notification(UUID, TEXT, TEXT, TEXT); -- 念のため古い型も削除


-- trade_notifications テーブルが存在しない場合は作成
CREATE TABLE IF NOT EXISTS public.trade_notifications (
  id uuid not null default extensions.uuid_generate_v4 (),
  user_id text not null,
  type text not null,
  content text not null,
  related_id uuid null,
  is_read boolean null default false,
  created_at timestamp with time zone null default now(),
  constraint trade_notifications_pkey primary key (id)
) TABLESPACE pg_default;

-- deck_notifications テーブルが存在しない場合は作成
CREATE TABLE IF NOT EXISTS public.deck_notifications (
  id uuid not null default extensions.uuid_generate_v4 (),
  user_id text not null,
  type text not null,
  content text not null,
  related_id uuid null,
  is_read boolean null default false,
  created_at timestamp with time zone null default now(),
  constraint deck_notifications_pkey primary key (id)
) TABLESPACE pg_default;

-- ====================================================================================================
-- create_trade_comment_notification 関数 (トレードコメント通知)
-- ====================================================================================================
CREATE OR REPLACE FUNCTION public.create_trade_comment_notification(
  p_post_id UUID,
  p_commenter_user_id UUID,  -- UUID型
  p_commenter_name TEXT      -- ゲストユーザーの場合は'匿名ユーザー'など
)
RETURNS VOID AS $$
DECLARE
  post_owner_id UUID; -- TEXTからUUIDに変更
  post_title TEXT;
  commenters RECORD;
BEGIN
  RAISE LOG 'create_trade_comment_notification: Started for post_id=%, commenter_user_id=%, commenter_name=%', p_post_id, p_commenter_user_id, p_commenter_name;

  -- 投稿者情報を取得 (trade_postsテーブルはowner_idを使用)
  SELECT owner_id, title INTO post_owner_id, post_title
  FROM public.trade_posts
  WHERE id = p_post_id;

  RAISE LOG 'create_trade_comment_notification: Post owner_id=%, title=%', post_owner_id, post_title;

  -- 投稿者への通知 (コメント投稿者が投稿者自身でない場合、またはゲストユーザーの場合)
  IF post_owner_id IS NOT NULL AND post_owner_id IS DISTINCT FROM p_commenter_user_id THEN
    RAISE LOG 'create_trade_comment_notification: Notifying post owner %', post_owner_id;
    INSERT INTO public.trade_notifications (user_id, type, content, related_id)
    VALUES (
      post_owner_id::TEXT, -- user_idカラムがTEXT型なのでキャスト
      'trade_comment',
      p_commenter_name || 'さんがあなたのトレード投稿「' || COALESCE(post_title, 'Unknown') || '」にコメントしました',
      p_post_id
    );
  ELSE
    RAISE LOG 'create_trade_comment_notification: Not notifying post owner (owner is null or is commenter).';
  END IF;

  -- 同じ投稿にコメントした他の会員ユーザーに通知 (コメント投稿者自身と投稿者は除く)
  FOR commenters IN
    SELECT DISTINCT user_id, user_name
    FROM public.trade_comments 
    WHERE post_id = p_post_id 
      AND user_id IS NOT NULL  -- 会員ユーザーのみが通知対象
      AND user_id IS DISTINCT FROM p_commenter_user_id  -- コメント投稿者自身は除く
      AND (post_owner_id IS NULL OR user_id IS DISTINCT FROM post_owner_id::TEXT) -- 投稿者自身は除く（重複回避）
  LOOP
    RAISE LOG 'create_trade_comment_notification: Notifying other commenter % (user_id: %)', commenters.user_name, commenters.user_id;
    INSERT INTO public.trade_notifications (user_id, type, content, related_id)
    VALUES (
      commenters.user_id,
      'trade_comment_reply',
      p_commenter_name || 'さんがトレード投稿「' || COALESCE(post_title, 'Unknown') || '」にコメントしました',
      p_post_id
    );
  END LOOP;

EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'create_trade_comment_notification: An error occurred: %', SQLERRM;
    -- エラーが発生してもコメント挿入は成功���せるため、ここでエラーを捕捉し何もしない
    NULL; 
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ====================================================================================================
-- create_deck_comment_notification 関数 (デッキコメント通知)
-- ====================================================================================================
CREATE OR REPLACE FUNCTION public.create_deck_comment_notification(
  p_deck_id UUID,
  p_commenter_user_id UUID,  -- UUID型
  p_commenter_name TEXT,     -- ゲストユーザーの場合は'匿名ユーザー'など
  p_comment_type TEXT        -- 'deck' または 'deck_page'
)
RETURNS VOID AS $$
DECLARE
  deck_owner_id UUID := NULL; -- TEXTからUUIDに変更
  deck_title TEXT;
  commenters RECORD;
BEGIN
  RAISE LOG 'create_deck_comment_notification: Started for deck_id=%, commenter_user_id=%, commenter_name=%, comment_type=%', p_deck_id, p_commenter_user_id, p_commenter_name, p_comment_type;

  IF p_comment_type = 'deck' THEN
    -- ユーザー作成デッキの場合 (decksテーブルはuser_idを使用)
    SELECT user_id, title INTO deck_owner_id, deck_title
    FROM public.decks
    WHERE id = p_deck_id;
    RAISE LOG 'create_deck_comment_notification: Deck type is "deck". Owner_id=%, title=%', deck_owner_id, deck_title;
  ELSIF p_comment_type = 'deck_page' THEN
    -- 管理者コンテンツの場合 (deck_pagesテーブルは所有者を持たない)
    SELECT deck_name INTO deck_title
    FROM public.deck_pages
    WHERE id = p_deck_id;
    deck_owner_id := NULL; -- 明示的にNULLを設定
    RAISE LOG 'create_deck_comment_notification: Deck type is "deck_page". Title=%, owner_id is NULL.', deck_title;
  END IF;

  -- デッキ作成者への通知 (ユーザー作成デッキの場合のみ、自分のコメントは除く)
  IF p_comment_type = 'deck' AND deck_owner_id IS NOT NULL AND deck_owner_id IS DISTINCT FROM p_commenter_user_id THEN
    RAISE LOG 'create_deck_comment_notification: Notifying deck owner %', deck_owner_id;
    INSERT INTO public.deck_notifications (user_id, type, content, related_id)
    VALUES (
      deck_owner_id::TEXT, -- user_idカラムがTEXT型なのでキャスト
      'deck_comment',
      p_commenter_name || 'さんがあなたのデッキ「' || COALESCE(deck_title, 'Unknown') || '」にコメントしました',
      p_deck_id
    );
  ELSE
    RAISE LOG 'create_deck_comment_notification: Not notifying deck owner (not "deck" type, owner is null, or is commenter).';
  END IF;

  -- 同じデッキにコメントした他の会員ユーザーに通知 (コメント投稿者自身とデッキ作成者は除く)
  FOR commenters IN
    SELECT DISTINCT user_id, user_name
    FROM public.deck_comments 
    WHERE deck_id = p_deck_id 
      AND user_id IS NOT NULL  -- 会員ユーザーのみが通知対象
      AND user_id IS DISTINCT FROM p_commenter_user_id  -- コメント投稿者自身は除く
      AND (deck_owner_id IS NULL OR user_id IS DISTINCT FROM deck_owner_id::TEXT) -- デッキ作成者は除く（重複回避）
  LOOP
    RAISE LOG 'create_deck_comment_notification: Notifying other commenter % (user_id: %)', commenters.user_name, commenters.user_id;
    INSERT INTO public.deck_notifications (user_id, type, content, related_id)
    VALUES (
      commenters.user_id,
      'deck_comment_reply',
      p_commenter_name || 'さんがデッキ「' || COALESCE(deck_title, 'Unknown') || '」にコメントしました',
      p_deck_id
    );
  END LOOP;

EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'create_deck_comment_notification: An error occurred: %', SQLERRM;
    -- エラーが発生してもコメント挿入は成功させるため、ここでエラーを捕捉し何もしない
    NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ====================================================================================================
-- トリガーの再作成
-- ====================================================================================================

-- trade_comments テーブルのトリガー
CREATE TRIGGER trade_comment_notification_trigger
AFTER INSERT ON public.trade_comments
FOR EACH ROW EXECUTE FUNCTION public.create_trade_comment_notification(
  NEW.post_id,
  NEW.user_id,
  COALESCE(NEW.user_name, '匿名ユーザー')
);

-- deck_comments テーブルのトリガー
CREATE TRIGGER deck_comment_notification_trigger
AFTER INSERT ON public.deck_comments
FOR EACH ROW EXECUTE FUNCTION public.create_deck_comment_notification(
  NEW.deck_id,
  NEW.user_id,
  COALESCE(NEW.user_name, '匿名ユーザー'),
  NEW.comment_type
);
