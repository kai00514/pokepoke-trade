-- 関数を削除して再作成し、依存関係のエラーを回避
DROP FUNCTION IF EXISTS public.create_trade_comment_notification(uuid, text, text) CASCADE;
DROP FUNCTION IF EXISTS public.trigger_trade_comment_notification() CASCADE;

-- create_trade_comment_notification 関数を再作成
CREATE OR REPLACE FUNCTION public.create_trade_comment_notification(
  p_post_id uuid,
  p_commenter_user_id text,
  p_commenter_name text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  post_owner_id text;
  post_title text;
  commenters record;
BEGIN
  -- トレード投稿の所有者とタイトルを取得
  SELECT owner_id, title INTO post_owner_id, post_title
  FROM trade_posts
  WHERE id = p_post_id;

  -- 投稿者に通知（自分のコメントは除く、ゲストコメントは含む）
  -- post_owner_id が存在し、かつコメント者がゲストであるか、またはコメント者が投稿者と異なる場合
  IF post_owner_id IS NOT NULL AND (p_commenter_user_id IS NULL OR post_owner_id != p_commenter_user_id) THEN
    INSERT INTO trade_notifications (user_id, type, content, related_id)
    VALUES (
      post_owner_id,
      'trade_comment',
      p_commenter_name || 'さんがあなたのトレード投稿「' || post_title || '」にコメントしました',
      p_post_id
    );
  END IF;

  -- 同じ投稿にコメントした他の会員ユーザーに通知（コメント投稿者自身と投稿者は除く、ゲストコメントは含む）
  FOR commenters IN
    SELECT DISTINCT user_id, user_name
    FROM trade_comments
    WHERE post_id = p_post_id
      AND user_id IS NOT NULL -- 会員ユーザーのみを対象
      AND (p_commenter_user_id IS NULL OR user_id != p_commenter_user_id) -- コメント者がゲストか、または通知対象と異なる場合
      AND (post_owner_id IS NULL OR user_id != post_owner_id) -- 投稿者がゲストか、または通知対象と異なる場合
  LOOP
    INSERT INTO trade_notifications (user_id, type, content, related_id)
    VALUES (
      commenters.user_id,
      'trade_comment_reply',
      p_commenter_name || 'さんがトレード投稿「' || post_title || '」にコメントしました',
      p_post_id
    );
  END LOOP;

EXCEPTION
  WHEN OTHERS THEN
    -- エラーが発生してもトランザクションを中断しないようにする
    -- 実際にはログ記録サービスなどを使用することが推奨されます
    -- 例: INSERT INTO error_logs (message) VALUES (SQLERRM);
    NULL; -- 何もしない
END;
$$;

-- trigger_trade_comment_notification 関数を再作成
CREATE OR REPLACE FUNCTION public.trigger_trade_comment_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- ゲストユーザーからのコメントでも通知をトリガー
  PERFORM public.create_trade_comment_notification(
    NEW.post_id,
    NEW.user_id,
    COALESCE(NEW.user_name, '匿名ユーザー')
  );
  RETURN NEW;
END;
$$;

-- トリガーを再作成
DROP TRIGGER IF EXISTS trade_comment_notification_trigger ON public.trade_comments;
CREATE TRIGGER trade_comment_notification_trigger
AFTER INSERT ON public.trade_comments
FOR EACH ROW
EXECUTE FUNCTION public.trigger_trade_comment_notification();
