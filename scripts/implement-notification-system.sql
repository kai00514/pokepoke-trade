-- ===== トレード通知関数の実装 =====
CREATE OR REPLACE FUNCTION create_trade_comment_notification(
  p_post_id UUID,
  p_commenter_user_id TEXT,
  p_commenter_name TEXT
) RETURNS void AS $$
DECLARE
  post_owner_id UUID;
  post_title TEXT;
  commenters RECORD;
BEGIN
  -- 1. 投稿者情報を取得（認証済み投稿のみ）
  SELECT owner_id, title INTO post_owner_id, post_title
  FROM trade_posts 
  WHERE id = p_post_id AND is_authenticated = true;
  
  -- 2. 投稿者に通知（自分のコメントは除く）
  IF post_owner_id IS NOT NULL AND post_owner_id::TEXT != p_commenter_user_id THEN
    INSERT INTO trade_notifications (user_id, type, content, related_id)
    VALUES (
      post_owner_id::TEXT,
      'trade_comment',
      COALESCE(p_commenter_name, '匿名ユーザー') || 'さんがあなたのトレード投稿「' || 
      COALESCE(post_title, 'トレード投稿') || '」にコメントしました',
      p_post_id
    );
  END IF;
  
  -- 3. 同じ投稿にコメントした他のユーザーに通知
  FOR commenters IN
    SELECT DISTINCT user_id, COALESCE(user_name, guest_name, '匿名ユーザー') as display_name
    FROM trade_comments 
    WHERE post_id = p_post_id 
      AND user_id IS NOT NULL 
      AND NOT COALESCE(is_guest, false)
      AND NOT COALESCE(is_deleted, false)
      AND user_id != p_commenter_user_id 
      AND user_id != post_owner_id::TEXT
  LOOP
    INSERT INTO trade_notifications (user_id, type, content, related_id)
    VALUES (
      commenters.user_id,
      'trade_comment_reply',
      COALESCE(p_commenter_name, '匿名ユーザー') || 'さんがトレード投稿「' || 
      COALESCE(post_title, 'トレード投稿') || '」にコメントしました',
      p_post_id
    );
  END LOOP;
  
EXCEPTION
  WHEN OTHERS THEN
    -- エラーが発生してもコメント投稿は継続
    RAISE NOTICE 'Trade notification creation failed: %', SQLERRM;
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- ===== トレード通知トリガー関数の実装 =====
CREATE OR REPLACE FUNCTION trigger_trade_comment_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- 認証済みユーザーのコメントのみ通知作成
  IF NEW.user_id IS NOT NULL AND NOT COALESCE(NEW.is_guest, false) AND NOT COALESCE(NEW.is_deleted, false) THEN
    PERFORM create_trade_comment_notification(
      NEW.post_id,
      NEW.user_id,
      COALESCE(NEW.user_name, '匿名ユーザー')
    );
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- エラーが発生してもコメント投稿は継続
    RAISE NOTICE 'Trade notification trigger failed: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ===== デッキ通知関数の修正 =====
CREATE OR REPLACE FUNCTION create_deck_comment_notification(
  p_deck_id UUID,
  p_commenter_user_id UUID,
  p_commenter_name TEXT,
  p_comment_type TEXT DEFAULT 'deck'
) RETURNS void AS $$
DECLARE
  deck_owner_id UUID;
  deck_name TEXT;
  commenters RECORD;
BEGIN
  -- 1. デッキ情報取得（comment_typeに応じて分岐）
  IF p_comment_type = 'deck' THEN
    SELECT user_id, title INTO deck_owner_id, deck_name
    FROM decks WHERE id = p_deck_id;
  ELSIF p_comment_type = 'deck_page' THEN
    -- deck_pagesテーブルが存在する場合
    SELECT user_id, deck_name INTO deck_owner_id, deck_name
    FROM deck_pages WHERE id = p_deck_id;
  END IF;
  
  -- 2. 投稿者に通知（自分のコメントは除く）
  IF deck_owner_id IS NOT NULL AND deck_owner_id != p_commenter_user_id THEN
    INSERT INTO deck_notifications (user_id, type, content, related_id)
    VALUES (
      deck_owner_id::TEXT,
      'deck_comment',
      COALESCE(p_commenter_name, '匿名ユーザー') || 'さんがあなたのデッキ「' || 
      COALESCE(deck_name, 'デッキ') || '」にコメントしました',
      p_deck_id
    );
  END IF;
  
  -- 3. 同じデッキにコメントした他のユーザーに通知
  FOR commenters IN
    SELECT DISTINCT user_id, COALESCE(user_name, '匿名ユーザー') as display_name
    FROM deck_comments 
    WHERE deck_id = p_deck_id 
      AND comment_type = p_comment_type
      AND user_id IS NOT NULL 
      AND user_id != p_commenter_user_id 
      AND user_id != deck_owner_id
  LOOP
    INSERT INTO deck_notifications (user_id, type, content, related_id)
    VALUES (
      commenters.user_id::TEXT,
      'deck_comment_reply',
      COALESCE(p_commenter_name, '匿名ユーザー') || 'さんがデッキ「' || 
      COALESCE(deck_name, 'デッキ') || '」にコメントしました',
      p_deck_id
    );
  END LOOP;
  
EXCEPTION
  WHEN OTHERS THEN
    -- エラーが発生してもコメント投稿は継続
    RAISE NOTICE 'Deck notification creation failed: %', SQLERRM;
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- ===== デッキ通知トリガー関数の修正 =====
CREATE OR REPLACE FUNCTION trigger_deck_comment_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- 認証済みユーザーのコメントのみ通知作成
  IF NEW.user_id IS NOT NULL THEN
    PERFORM create_deck_comment_notification(
      NEW.deck_id,
      NEW.user_id,
      COALESCE(NEW.user_name, '匿名ユーザー'),
      NEW.comment_type
    );
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- エラーが発生してもコメント投稿は継続
    RAISE NOTICE 'Deck notification trigger failed: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ===== 通知機能の有効化確認 =====
-- 既存のトリガーが無効化されている場合は再有効化
DROP TRIGGER IF EXISTS trade_comment_notification_trigger ON trade_comments;
CREATE TRIGGER trade_comment_notification_trigger
  AFTER INSERT ON trade_comments
  FOR EACH ROW
  EXECUTE FUNCTION trigger_trade_comment_notification();

DROP TRIGGER IF EXISTS deck_comment_notification_trigger ON deck_comments;
CREATE TRIGGER deck_comment_notification_trigger
  AFTER INSERT ON deck_comments
  FOR EACH ROW
  EXECUTE FUNCTION trigger_deck_comment_notification();
