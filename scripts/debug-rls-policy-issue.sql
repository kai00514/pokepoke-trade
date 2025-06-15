-- RLSポリシーエラーの詳細調査とデバッグ

-- 1. 現在のポリシー状況を確認
SELECT 
    'Current INSERT policies:' as info,
    policyname, 
    with_check
FROM pg_policies 
WHERE tablename = 'trade_posts' AND cmd = 'INSERT'
ORDER BY policyname;

-- 2. 現在の認証状態を確認
SELECT 
    'Current auth state:' as info,
    auth.uid() as current_user_id,
    auth.role() as current_role,
    current_user as db_user;

-- 3. テーブル構造を確認
SELECT 
    'Table structure:' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'trade_posts' 
AND column_name IN ('id', 'owner_id', 'is_authenticated', 'guest_name', 'title', 'status')
ORDER BY ordinal_position;

-- 4. 実際の挿入テストを実行（認証済みユーザー）
-- まず、現在のauth.uid()を確認
DO $$
DECLARE
    current_auth_uid uuid;
    test_post_id uuid;
BEGIN
    -- 現在の認証状態を取得
    current_auth_uid := auth.uid();
    
    RAISE NOTICE 'Current auth.uid(): %', current_auth_uid;
    
    IF current_auth_uid IS NOT NULL THEN
        -- テスト用のUUIDを生成
        test_post_id := gen_random_uuid();
        
        RAISE NOTICE 'Attempting to insert with:';
        RAISE NOTICE '  id: %', test_post_id;
        RAISE NOTICE '  owner_id: %', current_auth_uid;
        RAISE NOTICE '  is_authenticated: true';
        RAISE NOTICE '  guest_name: NULL';
        
        -- 実際の挿入を試行
        BEGIN
            INSERT INTO trade_posts (
                id,
                title, 
                owner_id, 
                is_authenticated, 
                guest_name,
                status
            ) VALUES (
                test_post_id,
                'RLS Debug Test', 
                current_auth_uid, 
                true, 
                NULL,
                'OPEN'
            );
            
            RAISE NOTICE 'SUCCESS: Test insert completed successfully';
            
            -- テストデータを削除
            DELETE FROM trade_posts WHERE id = test_post_id;
            RAISE NOTICE 'Test data cleaned up';
            
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'ERROR: Insert failed with: % - %', SQLSTATE, SQLERRM;
        END;
    ELSE
        RAISE NOTICE 'No authenticated user found (auth.uid() is NULL)';
    END IF;
END $$;

-- 5. ポリシー条件の詳細チェック
-- 現在残っているINSERTポリシーの条件を分解して確認
SELECT 
    'Policy condition analysis:' as info,
    policyname,
    CASE 
        WHEN with_check LIKE '%auth.uid() IS NOT NULL%' THEN 'Requires auth.uid() IS NOT NULL'
        ELSE 'No auth.uid() requirement'
    END as auth_requirement,
    CASE 
        WHEN with_check LIKE '%owner_id IS NOT NULL%' THEN 'Requires owner_id IS NOT NULL'
        ELSE 'No owner_id requirement'
    END as owner_id_requirement,
    CASE 
        WHEN with_check LIKE '%owner_id = auth.uid()%' THEN 'Requires owner_id = auth.uid()'
        ELSE 'No owner_id match requirement'
    END as owner_match_requirement,
    CASE 
        WHEN with_check LIKE '%is_authenticated = true%' THEN 'Requires is_authenticated = true'
        ELSE 'No is_authenticated requirement'
    END as auth_flag_requirement
FROM pg_policies 
WHERE tablename = 'trade_posts' AND cmd = 'INSERT';

-- 6. 一時的にRLSを無効化してテスト（管理者権限が必要）
-- 注意: これは一時的なテスト用です
/*
ALTER TABLE trade_posts DISABLE ROW LEVEL SECURITY;

-- テスト挿入
INSERT INTO trade_posts (
    id,
    title, 
    owner_id, 
    is_authenticated, 
    guest_name,
    status
) VALUES (
    gen_random_uuid(),
    'RLS Disabled Test', 
    'dba9dfdc-b861-4586-9671-ebb2adae2b90'::uuid, 
    true, 
    NULL,
    'OPEN'
);

-- RLSを再有効化
ALTER TABLE trade_posts ENABLE ROW LEVEL SECURITY;
*/

-- 7. 現在のポリシーを一時的に削除して、シンプルなポリシーでテスト
-- 既存のINSERTポリシーを一時的に削除
DROP POLICY IF EXISTS "trade_posts_allow_authenticated_insert" ON trade_posts;

-- 非常にシンプルなテスト用ポリシーを作成
CREATE POLICY "test_simple_insert" ON trade_posts
    FOR INSERT WITH CHECK (true);

-- テスト挿入を実行
DO $$
DECLARE
    test_post_id uuid;
BEGIN
    test_post_id := gen_random_uuid();
    
    BEGIN
        INSERT INTO trade_posts (
            id,
            title, 
            owner_id, 
            is_authenticated, 
            guest_name,
            status
        ) VALUES (
            test_post_id,
            'Simple Policy Test', 
            auth.uid(), 
            true, 
            NULL,
            'OPEN'
        );
        
        RAISE NOTICE 'SUCCESS: Simple policy test passed';
        
        -- テストデータを削除
        DELETE FROM trade_posts WHERE id = test_post_id;
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'ERROR: Even simple policy failed: % - %', SQLSTATE, SQLERRM;
    END;
END $$;

-- シンプルなテストポリシーを削除
DROP POLICY IF EXISTS "test_simple_insert" ON trade_posts;

-- 正しいポリシーを再作成
CREATE POLICY "trade_posts_authenticated_insert_fixed" ON trade_posts
    FOR INSERT WITH CHECK (
        -- 認証済みユーザーの場合
        (
            auth.uid() IS NOT NULL AND 
            owner_id IS NOT NULL AND 
            owner_id = auth.uid() AND
            is_authenticated = true AND
            (guest_name IS NULL OR guest_name = '')
        )
        OR
        -- ゲストユーザーの場合
        (
            (auth.uid() IS NULL OR auth.role() = 'anon') AND 
            owner_id IS NULL AND 
            guest_name IS NOT NULL AND
            guest_name != '' AND
            is_authenticated = false
        )
    );

-- 最終確認
SELECT 
    'Final policy check:' as info,
    policyname, 
    cmd,
    with_check
FROM pg_policies 
WHERE tablename = 'trade_posts' AND cmd = 'INSERT'
ORDER BY policyname;
