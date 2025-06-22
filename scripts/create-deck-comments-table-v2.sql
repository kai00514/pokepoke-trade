-- deck_comments テーブルを作成（is_deletedカラムを削除）
CREATE TABLE IF NOT EXISTS deck_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  deck_id UUID NOT NULL REFERENCES deck_pages(id), -- ここを修正しました！
  user_id UUID REFERENCES auth.users(id),
  user_name TEXT,
  content TEXT NOT NULL,
  is_guest BOOLEAN DEFAULT false,
  is_edited BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックスを作成
CREATE INDEX IF NOT EXISTS idx_deck_comments_deck_id ON deck_comments(deck_id);
CREATE INDEX IF NOT EXISTS idx_deck_comments_created_at ON deck_comments(created_at);

-- RLSポリシーを設定
ALTER TABLE deck_comments ENABLE ROW LEVEL SECURITY;

-- 全ユーザーがコメントを読み取り可能
CREATE POLICY "Anyone can view deck comments" ON deck_comments
  FOR SELECT USING (true);

-- 認証済みユーザーとゲストがコメントを投稿可能
CREATE POLICY "Anyone can insert deck comments" ON deck_comments
  FOR INSERT WITH CHECK (true);

-- ユーザーは自分のコメントを更新可能
CREATE POLICY "Users can update own deck comments" ON deck_comments
  FOR UPDATE USING (auth.uid() = user_id);
