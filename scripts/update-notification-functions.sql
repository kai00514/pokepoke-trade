-- トレード投稿のコメント通知を作成する関数
CREATE OR REPLACE FUNCTION create_trade_comment_notification(
  p_post_id UUID,
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
  -- 投稿者の情報を取得
  SELECT user_id, title INTO post_owner_id, post_title
  FROM trade_posts 
  WHERE id = p_post_id;
  
  -- 投稿者に通知（自分のコメントは除く）
  IF post_owner_id IS NOT NULL AND post_owner_id != p_commenter_user_id THEN
    INSERT INTO trade_notifications (user_id, type, content, related_id)
    VALUES (
      post_owner_id,
      'trade_comment',
      p_commenter_name || 'さんがあなたのトレード投稿「' || post_title || '」にコメントしました',
      p_post_id
    );
  END IF;
  
  -- 同じ投稿にコメントした他のユーザーに通知
  FOR commenters IN
    SELECT DISTINCT user_id, user_name
    FROM trade_comments 
    WHERE post_id = p_post_id 
      AND user_id IS NOT NULL 
      AND user_id != p_commenter_user_id 
      AND user_id != post_owner_id
  LOOP
    INSERT INTO trade_notifications (user_id, type, content, related_id)
    VALUES (
      commenters.user_id,
      'trade_comment_reply',
      p_commenter_name || 'さんがトレード投稿「' || post_title || '」にコメントしました',
      p_post_id
    );
  END LOOP;
END;
$$;

-- デッキ投稿のコメント通知を作成する関数
CREATE OR REPLACE FUNCTION create_deck_comment_notification(
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
  -- デッキ投稿者の情報を取得
  SELECT user_id, deck_name INTO deck_owner_id, deck_name
  FROM deck_pages 
  WHERE id = p_deck_id;
  
  -- 投稿者に通知（自分のコメントは除く）
  IF deck_owner_id IS NOT NULL AND deck_owner_id != p_commenter_user_id THEN
    INSERT INTO deck_notifications (user_id, type, content, related_id)
    VALUES (
      deck_owner_id,
      'deck_comment',
      p_commenter_name || 'さんがあなたのデッキ「' || deck_name || '」にコメントしました',
      p_deck_id
    );
  END IF;
  
  -- 同じデッキにコメントした他のユーザーに通知
  FOR commenters IN
    SELECT DISTINCT user_id, user_name
    FROM deck_comments 
    WHERE deck_id = p_deck_id 
      AND user_id IS NOT NULL 
      AND user_id != p_commenter_user_id 
      AND user_id != deck_owner_id
  LOOP
    INSERT INTO deck_notifications (user_id, type, content, related_id)
    VALUES (
      commenters.user_id,
      'deck_comment_reply',
      p_commenter_name || 'さんがデッキ「' || deck_name || '」にコメントしました',
      p_deck_id
    );
  END LOOP;
END;
$$;
