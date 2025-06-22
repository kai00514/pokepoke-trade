-- 既存の関数を削除
DROP FUNCTION IF EXISTS create_trade_comment_notification(UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS create_deck_comment_notification(UUID, TEXT, TEXT);

-- トレード投稿のコメント通知を作成する関数 (デバッグログ追加版)
CREATE OR REPLACE FUNCTION create_trade_comment_notification(
  p_post_id UUID, -- 引数名を元の p_post_id に戻します
  p_commenter_user_id TEXT,
  p_commenter_name TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  post_owner_id TEXT;
  post_title TEXT;
  commenters RECORD;
BEGIN
  RAISE NOTICE 'DEBUG: create_trade_comment_notification called for post_id: %, commenter_user_id: %, commenter_name: %', p_post_id, p_commenter_user_id, p_commenter_name;

  -- 投稿者の情報を取得
  SELECT user_id, title INTO post_owner_id, post_title
  FROM trade_posts 
  WHERE id = p_post_id;
  
  RAISE NOTICE 'DEBUG: Post owner_id: %, post_title: %', post_owner_id, post_title;

  -- 投稿者に通知（自分のコメントは除く）
  IF post_owner_id IS NOT NULL AND post_owner_id != p_commenter_user_id THEN
    RAISE NOTICE 'DEBUG: Notifying post owner: %', post_owner_id;
    INSERT INTO trade_notifications (user_id, type, content, related_id)
    VALUES (
      post_owner_id,
      'trade_comment',
      p_commenter_name || 'さんがあなたのトレード投稿「' || post_title || '」にコメントしました',
      p_post_id
    );
  ELSE
    RAISE NOTICE 'DEBUG: Not notifying post owner. post_owner_id: %, p_commenter_user_id: %', post_owner_id, p_commenter_user_id;
  END IF;
  
  -- 同じ投稿にコメントした他のユーザーに通知
  RAISE NOTICE 'DEBUG: Checking for other commenters on post_id: %', p_post_id;
  FOR commenters IN
    SELECT DISTINCT user_id, user_name
    FROM trade_comments 
    WHERE post_id = p_post_id 
      AND user_id IS NOT NULL 
      AND user_id != p_commenter_user_id 
      AND user_id != post_owner_id
  LOOP
    RAISE NOTICE 'DEBUG: Notifying other commenter: % (user_name: %)', commenters.user_id, commenters.user_name;
    INSERT INTO trade_notifications (user_id, type, content, related_id)
    VALUES (
      commenters.user_id,
      'trade_comment_reply',
      p_commenter_name || 'さんがトレード投稿「' || post_title || '」にコメントしました',
      p_post_id
    );
  END LOOP;
  RAISE NOTICE 'DEBUG: Finished checking for other commenters.';
END;
$$;

-- デッキ投稿のコメント通知を作成する関数 (デバッグログ追加版)
CREATE OR REPLACE FUNCTION create_deck_comment_notification(
  p_deck_id UUID,
  p_commenter_user_id TEXT, -- deck_comments.user_id が TEXT 型のため、ここも TEXT に合わせます
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
  RAISE NOTICE 'DEBUG: create_deck_comment_notification called for deck_id: %, commenter_user_id: %, commenter_name: %', p_deck_id, p_commenter_user_id, p_commenter_name;

  -- デッキ投稿者の情報を取得
  SELECT user_id, deck_name INTO deck_owner_id, deck_name
  FROM deck_pages 
  WHERE id = p_deck_id;
  
  RAISE NOTICE 'DEBUG: Deck owner_id: %, deck_name: %', deck_owner_id, deck_name;

  -- 投稿者に通知（自分のコメントは除く）
  IF deck_owner_id IS NOT NULL AND deck_owner_id != p_commenter_user_id THEN
    RAISE NOTICE 'DEBUG: Notifying deck owner: %', deck_owner_id;
    INSERT INTO deck_notifications (user_id, type, content, related_id)
    VALUES (
      deck_owner_id,
      'deck_comment',
      p_commenter_name || 'さんがあなたのデッキ「' || deck_name || '」にコメントしました',
      p_deck_id
    );
  ELSE
    RAISE NOTICE 'DEBUG: Not notifying deck owner. deck_owner_id: %, p_commenter_user_id: %', deck_owner_id, p_commenter_user_id;
  END IF;
  
  -- 同じデッキにコメントした他のユーザーに通知
  RAISE NOTICE 'DEBUG: Checking for other commenters on deck_id: %', p_deck_id;
  FOR commenters IN
    SELECT DISTINCT user_id, user_name
    FROM deck_comments 
    WHERE deck_id = p_deck_id 
      AND user_id IS NOT NULL 
      AND user_id != p_commenter_user_id 
      AND user_id != deck_owner_id
  LOOP
    RAISE NOTICE 'DEBUG: Notifying other deck commenter: % (user_name: %)', commenters.user_id, commenters.user_name;
    INSERT INTO deck_notifications (user_id, type, content, related_id)
    VALUES (
      commenters.user_id,
      'deck_comment_reply',
      p_commenter_name || 'さんがデッキ「' || deck_name || '」にコメントしました',
      p_deck_id
    );
  END LOOP;
  RAISE NOTICE 'DEBUG: Finished checking for other deck commenters.';
END;
$$;
