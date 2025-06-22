-- デッキコメント通知関数を修正（管理者コンテンツ対応）
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
  SELECT user_id, title INTO deck_owner_id, deck_name
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
  
  -- ユーザー作成デッキの場合のみ、投稿者に通知（自分のコメントは除く）
  IF is_user_deck AND deck_owner_id IS NOT NULL AND deck_owner_id != p_commenter_user_id THEN
    INSERT INTO deck_notifications (user_id, type, content, related_id)
    VALUES (
      deck_owner_id,
      'deck_comment',
      p_commenter_name || 'さんがあなたのデッキ「' || COALESCE(deck_name, 'タイトルなし') || '」にコメントしました',
      p_deck_id
    );
  END IF;
  
  -- 同じデッキにコメントした他のユーザーに通知（ユーザー作成・管理者コンテンツ問わず）
  FOR commenters IN
    SELECT DISTINCT user_id, user_name
    FROM deck_comments 
    WHERE deck_id = p_deck_id 
      AND user_id IS NOT NULL 
      AND user_id != p_commenter_user_id 
      AND (deck_owner_id IS NULL OR user_id != deck_owner_id)
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
