-- deck_pagesテーブルにeval_valueとeval_countカラムを追加
ALTER TABLE deck_pages 
ADD COLUMN IF NOT EXISTS eval_value DECIMAL(3,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS eval_count INTEGER DEFAULT 0;

-- 個別の評価を保存するテーブルを作成
CREATE TABLE IF NOT EXISTS deck_evaluations (
  id SERIAL PRIMARY KEY,
  deck_page_id INTEGER REFERENCES deck_pages(deck_page_id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(deck_page_id, user_id)
);

-- RLSポリシーを設定
ALTER TABLE deck_evaluations ENABLE ROW LEVEL SECURITY;

-- 誰でも評価を読み取れる
CREATE POLICY "Anyone can read evaluations" ON deck_evaluations
  FOR SELECT USING (true);

-- 認証されたユーザーは自分の評価を挿入・更新できる
CREATE POLICY "Users can insert their own evaluations" ON deck_evaluations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own evaluations" ON deck_evaluations
  FOR UPDATE USING (auth.uid() = user_id);
