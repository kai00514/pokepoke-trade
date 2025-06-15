-- 一時的にRLSを緩和してテストするスクリプト
-- 問題の根本原因を特定するため

-- 現在のINSERTポリシーを確認（正しいクエリ）
SELECT 
    'Actual INSERT policies:' as info,
    policyname, 
    with_check
FROM pg_policies 
WHERE tablename = 'trade_posts' AND cmd = 'INSERT'
ORDER BY policyname;

-- 一時的に既存のINSERTポリシーを削除
DROP POLICY IF EXISTS "trade_posts_authenticated_insert_fixed" ON trade_posts;

-- 非常に緩いテスト用ポリシーを作成（一時的）
CREATE POLICY "temp_allow_all_insert" ON trade_posts
    FOR INSERT WITH CHECK (
        -- 基本的な必須フィールドのみチェック
        title IS NOT NULL AND 
        title != '' AND
        status IS NOT NULL AND
        (
            -- 認証済みユーザーの場合
            (owner_id IS NOT NULL AND is_authenticated = true AND guest_name IS NULL)
            OR
            -- ゲストユーザーの場合  
            (owner_id IS NULL AND is_authenticated = false AND guest_name IS NOT NULL AND guest_name != '')
        )
    );

-- 関連テーブルのポリシーも一時的に緩和
-- trade_post_wanted_cards
DROP POLICY IF EXISTS "wanted_cards_allow_insert" ON trade_post_wanted_cards;
CREATE POLICY "temp_wanted_cards_insert" ON trade_post_wanted_cards
    FOR INSERT WITH CHECK (
        post_id IS NOT NULL AND card_id IS NOT NULL
    );

-- trade_post_offered_cards  
DROP POLICY IF EXISTS "offered_cards_allow_insert" ON trade_post_offered_cards;
CREATE POLICY "temp_offered_cards_insert" ON trade_post_offered_cards
    FOR INSERT WITH CHECK (
        post_id IS NOT NULL AND card_id IS NOT NULL
    );

-- 現在のポリシー状況を確認
SELECT 
    'Temporary policies created:' as info,
    tablename,
    policyname, 
    cmd
FROM pg_policies 
WHERE tablename IN ('trade_posts', 'trade_post_wanted_cards', 'trade_post_offered_cards')
AND cmd = 'INSERT'
ORDER BY tablename, policyname;
