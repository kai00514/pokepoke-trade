-- カテゴリ別のデッキ数を確認
SELECT 
  category,
  COUNT(*) as deck_count,
  AVG(view_count) as avg_views,
  AVG(like_count) as avg_likes
FROM deck_pages 
WHERE is_published = true
GROUP BY category
ORDER BY category;

-- 各カテゴリのサンプルデータを確認
SELECT 
  category,
  title,
  deck_name,
  tier_rank,
  view_count,
  like_count
FROM deck_pages 
WHERE is_published = true
ORDER BY category, view_count DESC
LIMIT 20;
