-- トレード投稿の通知を管理するテーブルを作成
CREATE TABLE IF NOT EXISTS public.trade_notifications (
  id UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  related_id UUID NULL,
  is_read BOOLEAN NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
  CONSTRAINT trade_notifications_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

-- インデックスを作成
CREATE INDEX IF NOT EXISTS idx_trade_notifications_user_id 
ON public.trade_notifications USING btree (user_id) TABLESPACE pg_default;

-- リアルタイム通知のためのRLSポリシーを設定
ALTER TABLE public.trade_notifications ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分の通知のみ閲覧可能
CREATE POLICY "Users can view own notifications" ON public.trade_notifications
  FOR SELECT USING (auth.uid()::text = user_id);

-- ユーザーは自分の通知のみ更新可能（既読状態の変更など）
CREATE POLICY "Users can update own notifications" ON public.trade_notifications
  FOR UPDATE USING (auth.uid()::text = user_id);

-- システムが通知を挿入可能（サービスロールキー使用時）
CREATE POLICY "Service role can insert notifications" ON public.trade_notifications
  FOR INSERT WITH CHECK (true);
