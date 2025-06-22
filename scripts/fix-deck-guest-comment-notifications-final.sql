-- 既存のトリガーと関数を削除
DROP TRIGGER IF EXISTS deck_comment_notification_trigger ON deck_comments;
DROP FUNCTION IF EXISTS trigger_deck_comment_notification();
DROP FUNCTION IF EXISTS create_deck_comment_notification(UUID, TEXT, TEXT, TEXT);

-- デッキコメント通知関数を作成（IS DISTINCT FROM を使用）
CREATE OR REPLACE FUNCTION public.create_deck_comment_notification(
  p_deck_id UUID,
  p_commenter_user_id TEXT,
  p_commenter_name TEXT,
  p_comment_type TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deck_owner_id TEXT := NULL;
  deck_title TEXT := 'タイトルなし';
  commenters RECORD;
BEGIN
  IF p_comment_type = 'deck' THEN
    -- ユーザー作成デッキの場合（decksテーブルを参照）
    SELECT user_id, title INTO deck_owner_id, deck_title
    FROM decks 
    WHERE id = p_deck_id;
  ELSIF p_comment_type = 'deck_page' THEN
    -- 管理者コンテンツの場合（deck_pagesテーブルを参照）
    SELECT deck_name INTO deck_title
    FROM deck_pages 
    WHERE id = p_deck_id;
    -- deck_pagesには所有者がいないため、deck_owner_idはNULLのまま
  END IF;
  
  -- デッキ作成者に通知（ユーザー作成デッキの場合のみ、自分のコメントは除く）
  -- p_commenter_user_id が NULL の場合でも正しく動作するように IS DISTINCT FROM を使用
  IF p_comment_type = 'deck' AND deck_owner_id IS NOT NULL AND deck_owner_id IS DISTINCT FROM p_commenter_user_id THEN
    INSERT INTO deck_notifications (user_id, type, content, related_id)
    VALUES (
      deck_owner_id,
      'deck_comment',
      p_commenter_name || 'さんがあなたのデッキ「' || COALESCE(deck_title, 'タイトルなし') || '」にコメントしました',
      p_deck_id
    );
  END IF;
  
  -- 同じデッキにコメントした他の会員ユーザーに通知
  -- 会員ユーザーのみ（user_id IS NOT NULL）が通知対象
  -- コメント投稿者自身とデッキ作成者は除く
  FOR commenters IN
    SELECT DISTINCT user_id, user_name
    FROM deck_comments 
    WHERE deck_id = p_deck_id 
      AND user_id IS NOT NULL  -- 会員ユーザーのみ（ゲストユーザーは除外）
      AND user_id IS DISTINCT FROM p_commenter_user_id  -- コメント投稿者自身は除く (NULLの場合も考慮)
      AND (deck_owner_id IS NULL OR user_id IS DISTINCT FROM deck_owner_id)  -- デッキ作成者は除く (NULLの場合も考慮)
  LOOP
    INSERT INTO deck_notifications (user_id, type, content, related_id)
    VALUES (
      commenters.user_id,
      'deck_comment_reply',
      p_commenter_name || 'さんがデッキ「' || COALESCE(deck_title, 'タイトルなし') || '」にコメントしました',
      p_deck_id
    );
  END LOOP;
END;
$$;

-- トリガー関数を作成
CREATE OR REPLACE FUNCTION public.trigger_deck_comment_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM public.create_deck_comment_notification(
    NEW.deck_id,
    NEW.user_id,  -- NULLの場合もあり（ゲストユーザー）
    COALESCE(NEW.user_name, '匿名ユーザー'),
    NEW.comment_type -- comment_typeを渡す
  );
  
  RETURN NEW;
END;
$$;

-- トリガーを作成
CREATE TRIGGER deck_comment_notification_trigger
  AFTER INSERT ON deck_comments
  FOR EACH ROW
  EXECUTE FUNCTION trigger_deck_comment_notification();
