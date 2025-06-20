-- deck_pagesテーブルにcategoryカラムを追加
ALTER TABLE deck_pages 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'featured';

-- カテゴリのENUM型を作成（オプション）
DO $$ BEGIN
    CREATE TYPE deck_category AS ENUM ('tier', 'newpack', 'featured');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- categoryカラムの型をENUMに変更
ALTER TABLE deck_pages 
ALTER COLUMN category TYPE deck_category USING category::deck_category;

-- 既存のデータにカテゴリを設定
-- tier_rankが低い（上位）ものをTierランキングに
UPDATE deck_pages 
SET category = 'tier' 
WHERE tier_rank <= 10;

-- 最近更新されたものを新パックデッキランキングに
UPDATE deck_pages 
SET category = 'newpack' 
WHERE updated_at >= NOW() - INTERVAL '30 days' 
AND category != 'tier';

-- 残りは注目ランキングに
UPDATE deck_pages 
SET category = 'featured' 
WHERE category NOT IN ('tier', 'newpack');

-- インデックスを作成
CREATE INDEX IF NOT EXISTS idx_deck_pages_category ON deck_pages(category);
CREATE INDEX IF NOT EXISTS idx_deck_pages_category_tier_rank ON deck_pages(category, tier_rank);
CREATE INDEX IF NOT EXISTS idx_deck_pages_category_view_count ON deck_pages(category, view_count DESC);

-- サンプルデータを各カテゴリに追加
INSERT INTO deck_pages (
  title,
  deck_name,
  thumbnail_image_url,
  tier_rank,
  view_count,
  like_count,
  comment_count,
  deck_description,
  category
) VALUES 
-- Tierランキング用
(
  'リザードンex最強構築',
  'リザードンex',
  '/placeholder.svg?width=150&height=210',
  4,
  4200,
  190,
  42,
  '環境上位のリザードンexデッキ。高火力と安定性を両立した構築。',
  'tier'
),
(
  'ピカチュウex電撃デッキ',
  'ピカチュウex',
  '/placeholder.svg?width=150&height=210',
  5,
  3800,
  165,
  35,
  'スピード重視のピカチュウexデッキ。序盤から圧倒的な展開力を誇る。',
  'tier'
),
-- 新パックデッキランキング用
(
  '新弾カードで組む最新デッキ',
  '最新デッキ',
  '/placeholder.svg?width=150&height=210',
  999,
  2100,
  95,
  28,
  '最新パックのカードを使った革新的なデッキ構築。',
  'newpack'
),
(
  '新環境対応型デッキ',
  '新環境デッキ',
  '/placeholder.svg?width=150&height=210',
  999,
  1800,
  78,
  22,
  '新しいメタゲームに対応したデッキレシピ。',
  'newpack'
),
-- 注目ランキング用
(
  'バズり中の話題デッキ',
  '話題デッキ',
  '/placeholder.svg?width=150&height=210',
  999,
  8500,
  420,
  85,
  'SNSで話題沸騰中のユニークなデッキ構築。',
  'featured'
),
(
  '初心者おすすめデッキ',
  '初心者デッキ',
  '/placeholder.svg?width=150&height=210',
  999,
  6200,
  280,
  65,
  '初心者でも扱いやすい安定したデッキレシピ。',
  'featured'
);
