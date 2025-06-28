-- usersテーブルの現在の状態を確認
SELECT 
  schemaname, 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE tablename = 'users' AND schemaname = 'public';

-- 既存のRLSポリシーを全て削除
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.users;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.users;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.users;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.users;

-- RLSを一時的に無効化
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- テーブル構造を確認
\d public.users;

-- 非常に緩いRLSポリシーを設定
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 認証されたユーザーは全ての操作が可能
CREATE POLICY "Allow all operations for authenticated users" ON public.users
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 匿名ユーザーも読み取り可能（必要に応じて）
CREATE POLICY "Allow read for anonymous users" ON public.users
  FOR SELECT
  TO anon
  USING (true);

-- 権限を設定
GRANT ALL ON public.users TO authenticated;
GRANT SELECT ON public.users TO anon;

-- 設定されたポリシーを確認
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual, 
  with_check
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public';

-- 現在のユーザーを確認
SELECT auth.uid() as current_user_id, auth.email() as current_user_email;

-- usersテーブルの現在のデータを確認
SELECT id, email, display_name, pokepoke_id, created_at FROM public.users LIMIT 5;
