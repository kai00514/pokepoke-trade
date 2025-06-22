-- トレードコメント通知関数を修正（正しいカラム名を使用）
CREATE OR REPLACE FUNCTION public.create_trade_comment_notification(
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
  -- 投稿者の情報を取得（owner_idを使用）
  SELECT owner_id, title INTO post_owner_id, post_title
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
  
  -- 同じ投稿にコメントした他のユーザーに通知（post_idを使用）
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

-- トリガー関数も修正（post_idを使用）
CREATE OR REPLACE FUNCTION public.trigger_trade_comment_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.user_id IS NOT NULL THEN
    PERFORM public.create_trade_comment_notification(
      NEW.post_id,
      NEW.user_id,
      COALESCE(NEW.user_name, '匿名ユーザー')
    );
  END IF;
  RETURN NEW;
END;
$$;
