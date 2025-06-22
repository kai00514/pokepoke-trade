-- trade_comments テーブルの通知トリガーを削除
DROP TRIGGER IF EXISTS trade_comment_notification_trigger ON public.trade_comments;

-- deck_comments テーブルの通知トリガーを削除
DROP TRIGGER IF EXISTS deck_comment_notification_trigger ON public.deck_comments;

-- 念のため、関連する関数も削除します。
-- これにより、トリガーと関数が完全にクリーンな状態になります。
DROP FUNCTION IF EXISTS public.trigger_trade_comment_notification() CASCADE;
DROP FUNCTION IF EXISTS public.trigger_deck_comment_notification() CASCADE;
DROP FUNCTION IF EXISTS public.create_trade_comment_notification(uuid, uuid, text) CASCADE;
DROP FUNCTION IF EXISTS public.create_deck_comment_notification(uuid, text, text) CASCADE;
