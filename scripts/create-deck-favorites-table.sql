-- deck_favoritesテーブルを作成
CREATE TABLE IF NOT EXISTS public.deck_favorites (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    deck_id UUID NOT NULL REFERENCES public.decks(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, deck_id)
);

-- インデックスを作成
CREATE INDEX IF NOT EXISTS idx_deck_favorites_user_id ON public.deck_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_deck_favorites_deck_id ON public.deck_favorites(deck_id);
CREATE INDEX IF NOT EXISTS idx_deck_favorites_created_at ON public.deck_favorites(created_at);

-- RLS（Row Level Security）を有効化
ALTER TABLE public.deck_favorites ENABLE ROW LEVEL SECURITY;

-- RLSポリシーを作成
-- ユーザーは自分のお気に入りのみ表示可能
CREATE POLICY "Users can view own favorites" ON public.deck_favorites
    FOR SELECT USING (auth.uid() = user_id);

-- ユーザーは自分のお気に入りのみ追加可能
CREATE POLICY "Users can insert own favorites" ON public.deck_favorites
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ユーザーは自分のお気に入りのみ削除可能
CREATE POLICY "Users can delete own favorites" ON public.deck_favorites
    FOR DELETE USING (auth.uid() = user_id);

-- 権限を設定
GRANT ALL ON public.deck_favorites TO authenticated;
GRANT SELECT ON public.deck_favorites TO anon;

-- コメント
COMMENT ON TABLE public.deck_favorites IS 'ユーザーのデッキお気に入り情報を管理するテーブル';
COMMENT ON COLUMN public.deck_favorites.user_id IS 'お気に入りしたユーザーのID';
COMMENT ON COLUMN public.deck_favorites.deck_id IS 'お気に入りされたデッキのID';
COMMENT ON COLUMN public.deck_favorites.created_at IS 'お気に入りした日時';
