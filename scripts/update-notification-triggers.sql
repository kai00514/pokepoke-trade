-- トレードコメント挿入時の通知トリガー関数
CREATE OR REPLACE FUNCTION trigger_trade_comment_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- ゲストユーザーのコメントは通知しない
  IF NEW.user_id IS NOT NULL THEN
    PERFORM create_trade_comment_notification(
      NEW.post_id,
      NEW.user_id,
      COALESCE(NEW.user_name, '匿名ユーザー')
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- デッキコメント挿入時の通知トリガー関数
CREATE OR REPLACE FUNCTION trigger_deck_comment_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- ゲストユーザーのコメントは通知しない
  IF NEW.user_id IS NOT NULL THEN
    PERFORM create_deck_comment_notification(
      NEW.deck_id::UUID,
      NEW.user_id,
      COALESCE(NEW.user_name, '匿名ユーザー')
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- トリガーを作成
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
