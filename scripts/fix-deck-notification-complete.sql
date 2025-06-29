-- 既存のトリガーと関数を削除
DROP TRIGGER IF EXISTS deck_comment_notification_trigger ON deck_comments;
DROP FUNCTION IF EXISTS trigger_deck_comment_notification();
DROP FUNCTION IF EXISTS create_deck_comment_notification(UUID, TEXT, TEXT);

-- デッキコメント通知関数を作成（完全版）
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
  is_user_deck BOOLEAN := FALSE;
BEGIN
  -- まずdecksテーブル（ユーザー作成デッキ）から確認
  -- owner_idを使用（user_idではなく）
  SELECT owner_id, title INTO deck_owner_id, deck_name
  FROM decks 
  WHERE id = p_deck_id;
  
  IF deck_owner_id IS NOT NULL THEN
    is_user_deck := TRUE;
  ELSE
    -- decksテーブルで見つからない場合はdeck_pages（管理者コンテンツ）から確認
    SELECT deck_name INTO deck_name
    FROM deck_pages 
    WHERE id = p_deck_id;
    -- deck_pagesの場合、所有者はいない（管理者コンテンツのため）
    deck_owner_id := NULL;
  END IF;
  
  -- ユーザー作成デッキの場合のみ、デッキ作成者に通知（自分のコメントは除く）
  IF is_user_deck AND deck_owner_id IS NOT NULL AND deck_owner_id != p_commenter_user_id THEN
    INSERT INTO deck_notifications (user_id, type, content, related_id)
    VALUES (
      deck_owner_id,
      'deck_comment',
      p_commenter_name || 'さんがあなたのデッキ「' || COALESCE(deck_name, 'タイトルなし') || '」にコメントしました',
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
      AND user_id != p_commenter_user_id  -- コメント投稿者自身は除く
      AND (deck_owner_id IS NULL OR user_id != deck_owner_id)  -- デッキ作成者は除く（既に上で通知済み）
  LOOP
    INSERT INTO deck_notifications (user_id, type, content, related_id)
    VALUES (
      commenters.user_id,
      'deck_comment_reply',
      p_commenter_name || 'さんがデッキ「' || COALESCE(deck_name, 'タイトルなし') || '」にコメントしました',
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
  -- 会員ユーザーのコメントの場合のみ通知を生成
  -- ゲストユーザー（user_id IS NULL）のコメントでも、他の会員ユーザーには通知が送られる
  PERFORM public.create_deck_comment_notification(
    NEW.deck_id,
    NEW.user_id,  -- NULLの場合もあり（ゲストユーザー）
    COALESCE(NEW.user_name, '匿名ユーザー')
  );
  
  RETURN NEW;
END;
$$;

-- トリガーを作成
CREATE TRIGGER deck_comment_notification_trigger
  AFTER INSERT ON deck_comments
  FOR EACH ROW
  EXECUTE FUNCTION trigger_deck_comment_notification();
