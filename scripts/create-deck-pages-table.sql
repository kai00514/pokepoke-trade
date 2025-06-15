-- deck_pagesテーブルを作成
CREATE TABLE IF NOT EXISTS deck_pages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  deck_name TEXT NOT NULL,
  thumbnail_image_url TEXT,
  tier_rank INTEGER DEFAULT 999,
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  energy_type TEXT DEFAULT '無色',
  energy_image_url TEXT,
  cards_data JSONB DEFAULT '[]',
  deck_description TEXT DEFAULT '',
  tier_info JSONB DEFAULT '{"rank":"B","tier":"Bランク","descriptions":["バランスの取れたデッキ"]}',
  deck_stats JSONB DEFAULT '{"accessibility":3,"speed":3,"power":3,"durability":3,"stability":3}',
  strengths_weaknesses_list JSONB DEFAULT '[]',
  strengths_weaknesses_details JSONB DEFAULT '[]',
  how_to_play_list JSONB DEFAULT '[]',
  how_to_play_steps JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- サンプルデータを挿入
INSERT INTO deck_pages (
  title,
  deck_name,
  thumbnail_image_url,
  tier_rank,
  view_count,
  like_count,
  comment_count,
  deck_description
) VALUES 
(
  'アルセウスVSTAR最強構築',
  'アルセウスVSTAR',
  '/placeholder.svg?width=150&height=210',
  1,
  5200,
  180,
  45,
  '環境トップクラスの安定性を誇るアルセウスVSTARデッキ。どんな相手にも対応できる汎用性の高さが魅力。'
),
(
  'ミュウVMAX速攻型',
  'ミュウVMAX',
  '/placeholder.svg?width=150&height=210',
  2,
  4800,
  220,
  38,
  '序盤から高火力で攻めるミュウVMAXデッキ。スピード感のある展開で相手を圧倒する。'
),
(
  'ギラティナVSTARコントロール',
  'ギラティナVSTAR',
  '/placeholder.svg?width=150&height=210',
  3,
  3600,
  150,
  32,
  'コントロール要素を重視したギラティナVSTARデッキ。相手の動きを封じながら確実に勝利を掴む。'
);

-- インデックスを作成
CREATE INDEX IF NOT EXISTS idx_deck_pages_published ON deck_pages(is_published);
CREATE INDEX IF NOT EXISTS idx_deck_pages_tier_rank ON deck_pages(tier_rank);
CREATE INDEX IF NOT EXISTS idx_deck_pages_view_count ON deck_pages(view_count DESC);
CREATE INDEX IF NOT EXISTS idx_deck_pages_updated_at ON deck_pages(updated_at DESC);
