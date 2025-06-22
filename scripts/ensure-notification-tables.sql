-- trade_notifications テーブルの確認・作成
CREATE TABLE IF NOT EXISTS public.trade_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    content TEXT NOT NULL,
    related_id UUID,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- deck_notifications テーブルの確認・作成
CREATE TABLE IF NOT EXISTS public.deck_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    content TEXT NOT NULL,
    related_id UUID,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックスの作成（パフォーマンス向上のため）
CREATE INDEX IF NOT EXISTS idx_trade_notifications_user_id ON public.trade_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_trade_notifications_created_at ON public.trade_notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_deck_notifications_user_id ON public.deck_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_deck_notifications_created_at ON public.deck_notifications(created_at);
