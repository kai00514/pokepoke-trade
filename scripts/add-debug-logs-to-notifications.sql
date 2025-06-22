-- ===== trigger_trade_comment_notification 関数のデバッグログ追加 =====
CREATE OR REPLACE FUNCTION trigger_trade_comment_notification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE NOTICE 'DEBUG: trigger_trade_comment_notification called for post_id: %, user_id: %, is_guest: %', NEW.post_id, NEW.user_id, COALESCE(NEW.is_guest, FALSE);

  -- ゲストユーザーのコメントは通知しない
  IF NEW.user_id IS NOT NULL AND NOT COALESCE(NEW.is_guest, FALSE) THEN
    RAISE NOTICE 'DEBUG: Calling create_trade_comment_notification with post_id: %, user_id: %, user_name: %', NEW.post_id, NEW.user_id, COALESCE(NEW.user_name, '匿名ユーザー');
    PERFORM create_trade_comment_notification(
      NEW.post_id,
      NEW.user_id,
      COALESCE(NEW.user_name, '匿名ユーザー')
    );
  ELSE
    RAISE NOTICE 'DEBUG: Notification skipped in trigger_trade_comment_notification (user_id is NULL or is_guest is TRUE).';
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'ERROR in trigger_trade_comment_notification: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ===== create_trade_comment_notification 関数のデバッグログ追加 =====
CREATE OR REPLACE FUNCTION create_trade_comment_notification(
  p_trade_post_id UUID,
  p_commenter_user_id TEXT,    -- trade_comments.user_id が TEXT 型のため
  p_commenter_name TEXT
) RETURNS VOID AS $$
DECLARE
  trade_post_owner_id UUID;
  trade_post_title TEXT;
  notification_recipient_id TEXT;
  notification_content TEXT;
  already_notified_users TEXT[] := ARRAY[]::TEXT[]; -- 重複通知防止用
BEGIN
  RAISE NOTICE 'DEBUG: create_trade_comment_notification called for post_id: %, commenter_user_id: %, commenter_name: %', p_trade_post_id, p_commenter_user_id, p_commenter_name;

  -- 1. トレード投稿の情報を取得
  SELECT owner_id, title INTO trade_post_owner_id, trade_post_title
  FROM trade_posts
  WHERE id = p_trade_post_id AND is_authenticated = TRUE;

  IF NOT FOUND THEN
    RAISE NOTICE 'DEBUG: Trade post not found or not authenticated: %', p_trade_post_id;
    RETURN;
  END IF;
  RAISE NOTICE 'DEBUG: Trade post found. Owner: %, Title: %', trade_post_owner_id, trade_post_title;

  -- 2. トレード投稿の所有者に通知 (コメント投稿者自身への通知は除く)
  IF trade_post_owner_id IS NOT NULL AND trade_post_owner_id::TEXT != p_commenter_user_id THEN
    notification_recipient_id := trade_post_owner_id::TEXT;
    notification_content := COALESCE(p_commenter_name, '匿名ユーザー') || 
                            'さんがあなたのトレード「' || COALESCE(trade_post_title, '無題') || 
                            '」にコメントしました。';
    
    RAISE NOTICE 'DEBUG: Inserting notification for trade owner: %', notification_recipient_id;
    INSERT INTO trade_notifications (user_id, type, content, related_id)
    VALUES (notification_recipient_id, 'trade_comment', notification_content, p_trade_post_id);
    already_notified_users := array_append(already_notified_users, notification_recipient_id);
  ELSE
    RAISE NOTICE 'DEBUG: Skipping notification for trade owner (owner is NULL or is commenter).';
  END IF;

  -- 3. 同じトレード投稿に以前コメントした他のユーザーに通知
  --    (投稿所有者と今回のコメント投稿者自身は除く)
  FOR notification_recipient_id IN
    SELECT DISTINCT tc.user_id
    FROM trade_comments tc
    WHERE tc.post_id = p_trade_post_id
      AND tc.user_id IS NOT NULL
      AND tc.user_id != p_commenter_user_id                   -- 今回のコメント投稿者を除く
      AND tc.user_id != trade_post_owner_id::TEXT            -- 投稿所有者を除く (既に通知済みの場合も考慮)
      AND NOT (tc.user_id = ANY(already_notified_users))     -- 既にこの処理で通知済みのユーザーを除く
      AND NOT COALESCE(tc.is_guest, FALSE)
      AND NOT COALESCE(tc.is_deleted, FALSE)
  LOOP
    notification_content := COALESCE(p_commenter_name, '匿名ユーザー') || 
                            'さんがあなたがコメントしたトレード「' || COALESCE(trade_post_title, '無題') || 
                            '」に新しいコメントをしました。';
                            
    RAISE NOTICE 'DEBUG: Inserting notification for other commenter: %', notification_recipient_id;
    INSERT INTO trade_notifications (user_id, type, content, related_id)
    VALUES (notification_recipient_id, 'trade_comment_reply', notification_content, p_trade_post_id);
    already_notified_users := array_append(already_notified_users, notification_recipient_id);
  END LOOP;

EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'ERROR in create_trade_comment_notification for trade_post_id %: %', p_trade_post_id, SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- ===== trigger_deck_comment_notification 関数のデバッグログ追加 =====
CREATE OR REPLACE FUNCTION trigger_deck_comment_notification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE NOTICE 'DEBUG: trigger_deck_comment_notification called for deck_id: %, user_id: %, comment_type: %', NEW.deck_id, NEW.user_id, NEW.comment_type;

  -- ユーザーIDが存在する場合のみ通知を作成
  IF NEW.user_id IS NOT NULL THEN
    RAISE NOTICE 'DEBUG: Calling create_deck_comment_notification with deck_id: %, user_id: %, user_name: %, comment_type: %', NEW.deck_id, NEW.user_id, NEW.user_name, NEW.comment_type;
    PERFORM create_deck_comment_notification(
      NEW.deck_id,
      NEW.user_id,
      NEW.user_name,
      NEW.comment_type  -- comment_typeを渡す
    );
  ELSE
    RAISE NOTICE 'DEBUG: Notification skipped in trigger_deck_comment_notification (user_id is NULL).';
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'ERROR in trigger_deck_comment_notification: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ===== create_deck_comment_notification 関数のデバッグログ追加 =====
CREATE OR REPLACE FUNCTION create_deck_comment_notification(
  p_deck_id UUID,
  p_commenter_user_id UUID,    -- deck_comments.user_id が UUID 型のため
  p_commenter_name TEXT,
  p_deck_comment_type TEXT     -- 'deck' または 'deck_page'
) RETURNS VOID AS $$
DECLARE
  deck_owner_id UUID;
  deck_title TEXT;
  notification_recipient_id TEXT; -- 通知テーブルの user_id は TEXT 型
  notification_content TEXT;
  already_notified_users TEXT[] := ARRAY[]::TEXT[]; -- 重複通知防止用
BEGIN
  RAISE NOTICE 'DEBUG: create_deck_comment_notification called for deck_id: %, commenter_user_id: %, commenter_name: %, comment_type: %', p_deck_id, p_commenter_user_id, p_commenter_name, p_deck_comment_type;

  -- 1. デッキの情報を取得 (deck_comments.comment_type に応じて分岐)
  IF p_deck_comment_type = 'deck' THEN
    SELECT d.user_id, d.title INTO deck_owner_id, deck_title
    FROM decks d
    WHERE d.id = p_deck_id;
    RAISE NOTICE 'DEBUG: Fetched from decks table. Owner: %, Title: %', deck_owner_id, deck_title;
  ELSIF p_deck_comment_type = 'deck_page' THEN
    -- deck_pages テーブルが存在する場合の処理。
    -- このテーブル構造が不明なため、仮のフィールド名を使用します。
    -- 実際のフィールド名に合わせてください。
    SELECT dp.user_id, dp.deck_name INTO deck_owner_id, deck_title
    FROM deck_pages dp -- 仮のテーブル名とフィールド名
    WHERE dp.id = p_deck_id;
    RAISE NOTICE 'DEBUG: Fetched from deck_pages table. Owner: %, Title: %', deck_owner_id, deck_title;
  ELSE
    RAISE NOTICE 'DEBUG: Unknown deck_comment_type: % for deck_id %', p_deck_comment_type, p_deck_id;
    RETURN;
  END IF;

  -- デッキが存在しない場合は何もしない
  IF NOT FOUND THEN
    RAISE NOTICE 'DEBUG: Deck/DeckPage not found: % with type %', p_deck_id, p_deck_comment_type;
    RETURN;
  END IF;

  -- 2. デッキの所有者に通知 (コメント投稿者自身への通知は除く)
  IF deck_owner_id IS NOT NULL AND deck_owner_id != p_commenter_user_id THEN
    notification_recipient_id := deck_owner_id::TEXT;
    notification_content := COALESCE(p_commenter_name, '匿名ユーザー') || 
                            'さんがあなたのデッキ「' || COALESCE(deck_title, '無題') || 
                            '」にコメントしました。';
    
    RAISE NOTICE 'DEBUG: Inserting notification for deck owner: %', notification_recipient_id;
    INSERT INTO deck_notifications (user_id, type, content, related_id)
    VALUES (notification_recipient_id, 'deck_comment', notification_content, p_deck_id);
    already_notified_users := array_append(already_notified_users, notification_recipient_id);
  ELSE
    RAISE NOTICE 'DEBUG: Skipping notification for deck owner (owner is NULL or is commenter).';
  END IF;

  -- 3. 同じデッキに以前コメントした他のユーザーに通知
  --    (投稿所有者と今回のコメント投稿者自身は除く)
  FOR notification_recipient_id IN
    SELECT DISTINCT dc.user_id::TEXT -- TEXT型にキャスト
    FROM deck_comments dc
    WHERE dc.deck_id = p_deck_id
      AND dc.comment_type = p_deck_comment_type
      AND dc.user_id IS NOT NULL
      AND dc.user_id != p_commenter_user_id                 -- 今回のコメント投稿者を除く
      AND dc.user_id != deck_owner_id                     -- デッキ所有者を除く
      AND NOT (dc.user_id::TEXT = ANY(already_notified_users)) -- 既にこの処理で通知済みのユーザーを除く
      -- ゲストコメントは deck_comments には is_guest がないため、user_id IS NOT NULL で判定
  LOOP
    notification_content := COALESCE(p_commenter_name, '匿名ユーザー') || 
                            'さんがあなたがコメントしたデッキ「' || COALESCE(deck_title, '無題') || 
                            '」に新しいコメントをしました。';
                            
    RAISE NOTICE 'DEBUG: Inserting notification for other deck commenter: %', notification_recipient_id;
    INSERT INTO deck_notifications (user_id, type, content, related_id)
    VALUES (notification_recipient_id, 'deck_comment_reply', notification_content, p_deck_id);
    already_notified_users := array_append(already_notified_users, notification_recipient_id);
  END LOOP;

EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'ERROR in create_deck_comment_notification for deck_id %: %', p_deck_id, SQLERRM;
END;
$$ LANGUAGE plpgsql;
