-- 既存のINSERTポリシーをすべて削除
DROP POLICY IF EXISTS "Allow guest insert" ON trade_posts;
DROP POLICY IF EXISTS "Authenticated users can insert trade posts" ON trade_posts;
DROP POLICY IF EXISTS "trade_posts_allow_authenticated_insert" ON trade_posts;
DROP POLICY IF EXISTS "trade_posts_authenticated_insert_fixed" ON trade_posts;

-- シンプルなINSERTポリシーを作成（誰でも挿入可能）
CREATE POLICY "Allow all inserts" ON trade_posts
FOR INSERT
WITH CHECK (true);

-- 確認
SELECT 
  policyname,
  cmd,
  with_check
FROM pg_policies 
WHERE tablename = 'trade_posts' AND cmd = 'INSERT';
