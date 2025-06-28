-- 1. 既存のRLSポリシーを削除
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

-- 2. RLSを一時的に無効にして、テーブル構造を確認
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- 3. 新しいRLSポリシーを作成
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のプロファイルを表示できる
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

-- ユーザーは自分のプロファイルを更新できる
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- ユーザーは自分のプロファイルを挿入できる
CREATE POLICY "Users can insert own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 管理者は全てのプロファイルを表示できる
CREATE POLICY "Admins can view all profiles" ON public.users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- 管理者は全てのプロファイルを更新できる
CREATE POLICY "Admins can update all profiles" ON public.users
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- 4. テーブルの権限を確認・設定
GRANT ALL ON public.users TO authenticated;
GRANT SELECT ON public.users TO anon;

-- 5. 確認用クエリ
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
WHERE schemaname = 'public' 
AND tablename = 'users';
