-- trade_notifications テーブルのRLSを有効にし、ポリシーを設定
ALTER TABLE public.trade_notifications ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分の通知のみ閲覧可能
DROP POLICY IF EXISTS "Users can view own trade notifications" ON public.trade_notifications;
CREATE POLICY "Users can view own trade notifications" ON public.trade_notifications
  FOR SELECT USING (auth.uid()::text = user_id);

-- ユーザーは自分の通知のみ更新可能（既読状態の変更など）
DROP POLICY IF EXISTS "Users can update own trade notifications" ON public.trade_notifications;
CREATE POLICY "Users can update own trade notifications" ON public.trade_notifications
  FOR UPDATE USING (auth.uid()::text = user_id);

-- システムが通知を挿入可能（サービスロールキー使用時）
DROP POLICY IF EXISTS "Service role can insert trade notifications" ON public.trade_notifications;
CREATE POLICY "Service role can insert trade notifications" ON public.trade_notifications
  FOR INSERT WITH CHECK (true);

-- deck_notifications テーブルのRLSも同様に確認・設定
-- (もし存在しない場合は、create-deck-notifications-table.sql を実行してください)
ALTER TABLE public.deck_notifications ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分の通知のみ閲覧可能
DROP POLICY IF EXISTS "Users can view own deck notifications" ON public.deck_notifications;
CREATE POLICY "Users can view own deck notifications" ON public.deck_notifications
  FOR SELECT USING (auth.uid()::text = user_id);

-- ユーザーは自分の通知のみ更新可能（既読状態の変更など）
DROP POLICY IF EXISTS "Users can update own deck notifications" ON public.deck_notifications;
CREATE POLICY "Users can update own deck notifications" ON public.deck_notifications
  FOR UPDATE USING (auth.uid()::text = user_id);

-- システムが通知を挿入可能（サービスロールキー使用時）
DROP POLICY IF EXISTS "Service role can insert deck notifications" ON public.deck_notifications;
CREATE POLICY "Service role can insert deck notifications" ON public.deck_notifications
  FOR INSERT WITH CHECK (true);

SELECT 'RLS policies for trade_notifications and deck_notifications have been set/updated.' AS status;
