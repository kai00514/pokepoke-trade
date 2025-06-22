-- trade_comments テーブルのトリガーを無効化
ALTER TABLE trade_comments DISABLE TRIGGER trade_comment_notification_trigger;

-- deck_comments テーブルのトリガーを無効化
ALTER TABLE deck_comments DISABLE TRIGGER deck_comment_notification_trigger;
