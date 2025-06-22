-- decks テーブルが存在しない場合は作成
CREATE TABLE IF NOT EXISTS decks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    deck_list JSONB,
    category TEXT,
    like_count INTEGER DEFAULT 0,
    favorite_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    user_id UUID,
    user_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックスを作成
CREATE INDEX IF NOT EXISTS idx_decks_user_id ON decks(user_id);
CREATE INDEX IF NOT EXISTS idx_decks_category ON decks(category);
CREATE INDEX IF NOT EXISTS idx_decks_created_at ON decks(created_at);

-- RLS (Row Level Security) を有効化
ALTER TABLE decks ENABLE ROW LEVEL SECURITY;

-- 基本的なRLSポリシーを作成
CREATE POLICY "Enable read access for all users" ON decks
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON decks
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for users based on user_id" ON decks
    FOR UPDATE USING (auth.uid() = user_id);

-- テーブルが作成されたことを確認
\d decks;
