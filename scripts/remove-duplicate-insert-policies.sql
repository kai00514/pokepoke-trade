-- 重複するINSERTポリシーを削除（最小限の修正）

-- 古いINSERTポリシーのみを削除
DROP POLICY IF EXISTS "Allow guest insert" ON trade_posts;
DROP POLICY IF EXISTS "Authenticated users can insert trade posts" ON trade_posts;

-- 現在のポリシー状況を確認
SELECT 
    policyname, 
    cmd, 
    with_check
FROM pg_policies 
WHERE tablename = 'trade_posts' AND cmd = 'INSERT'
ORDER BY policyname;

-- 確認用: 残っているポリシーの詳細
SELECT 
    'Remaining INSERT policy:' as info,
    policyname,
    with_check
FROM pg_policies 
WHERE tablename = 'trade_posts' 
AND cmd = 'INSERT'
AND policyname = 'trade_posts_allow_authenticated_insert';
