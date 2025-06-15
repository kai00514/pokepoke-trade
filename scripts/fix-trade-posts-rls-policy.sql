-- RLSポリシーエラーを解決するためのスクリプト
-- "new row violates row-level security policy for table \"trade_posts\"" エラーの修正

-- 現在のポリシーを確認
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
WHERE tablename = 'trade_posts'
ORDER BY cmd, policyname;

-- 既存のtrade_postsポリシーを全て削除
DROP POLICY IF EXISTS "Allow read access to trade posts" ON trade_posts;
DROP POLICY IF EXISTS "Authenticated users can insert trade posts" ON trade_posts;
DROP POLICY IF EXISTS "Allow guest insert" ON trade_posts;
DROP POLICY IF EXISTS "Allow update for authenticated owners" ON trade_posts;
DROP POLICY IF EXISTS "Allow delete for authenticated owners" ON trade_posts;
DROP POLICY IF EXISTS "trade_posts_select_policy" ON trade_posts;
DROP POLICY IF EXISTS "trade_posts_insert_policy" ON trade_posts;
DROP POLICY IF EXISTS "trade_posts_update_policy" ON trade_posts;
DROP POLICY IF EXISTS "trade_posts_delete_policy" ON trade_posts;

-- 新しいシンプルで確実なポリシーを作成

-- 1. SELECT: 全ての投稿を誰でも読み取り可能
CREATE POLICY "trade_posts_allow_select" ON trade_posts
    FOR SELECT USING (true);

-- 2. INSERT: 認証済みユーザーの投稿を許可
CREATE POLICY "trade_posts_allow_authenticated_insert" ON trade_posts
    FOR INSERT WITH CHECK (
        -- 認証済みユーザーの場合
        (
            auth.uid() IS NOT NULL AND 
            owner_id IS NOT NULL AND 
            owner_id = auth.uid() AND
            is_authenticated = true AND
            guest_name IS NULL
        )
        OR
        -- ゲストユーザーの場合
        (
            auth.uid() IS NULL AND 
            owner_id IS NULL AND 
            guest_name IS NOT NULL AND
            guest_name != '' AND
            is_authenticated = false
        )
    );

-- 3. UPDATE: 認証済みユーザーは自分の投稿のみ編集可能
CREATE POLICY "trade_posts_allow_update" ON trade_posts
    FOR UPDATE USING (
        auth.uid() IS NOT NULL AND 
        owner_id IS NOT NULL AND 
        owner_id = auth.uid() AND
        is_authenticated = true
    ) WITH CHECK (
        auth.uid() IS NOT NULL AND 
        owner_id IS NOT NULL AND 
        owner_id = auth.uid() AND
        is_authenticated = true AND
        guest_name IS NULL
    );

-- 4. DELETE: 認証済みユーザーは自分の投稿のみ削除可能
CREATE POLICY "trade_posts_allow_delete" ON trade_posts
    FOR DELETE USING (
        auth.uid() IS NOT NULL AND 
        owner_id IS NOT NULL AND 
        owner_id = auth.uid() AND
        is_authenticated = true
    );

-- 関連テーブルのポリシーも修正

-- trade_post_wanted_cards テーブル
DROP POLICY IF EXISTS "Allow read wanted cards" ON trade_post_wanted_cards;
DROP POLICY IF EXISTS "Allow insert wanted cards" ON trade_post_wanted_cards;
DROP POLICY IF EXISTS "Allow update wanted cards" ON trade_post_wanted_cards;
DROP POLICY IF EXISTS "Allow delete wanted cards" ON trade_post_wanted_cards;
DROP POLICY IF EXISTS "wanted_cards_select_policy" ON trade_post_wanted_cards;
DROP POLICY IF EXISTS "wanted_cards_insert_policy" ON trade_post_wanted_cards;
DROP POLICY IF EXISTS "wanted_cards_update_policy" ON trade_post_wanted_cards;
DROP POLICY IF EXISTS "wanted_cards_delete_policy" ON trade_post_wanted_cards;

CREATE POLICY "wanted_cards_allow_select" ON trade_post_wanted_cards
    FOR SELECT USING (true);

CREATE POLICY "wanted_cards_allow_insert" ON trade_post_wanted_cards
    FOR INSERT WITH CHECK (
        post_id IS NOT NULL AND
        card_id IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM trade_posts 
            WHERE id = post_id AND (
                -- 認証済みユーザーの投稿
                (auth.uid() IS NOT NULL AND owner_id = auth.uid() AND is_authenticated = true) OR
                -- ゲストユーザーの投稿
                (auth.uid() IS NULL AND owner_id IS NULL AND is_authenticated = false)
            )
        )
    );

CREATE POLICY "wanted_cards_allow_update" ON trade_post_wanted_cards
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM trade_posts 
            WHERE id = post_id AND 
            auth.uid() IS NOT NULL AND 
            owner_id = auth.uid() AND
            is_authenticated = true
        )
    );

CREATE POLICY "wanted_cards_allow_delete" ON trade_post_wanted_cards
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM trade_posts 
            WHERE id = post_id AND 
            auth.uid() IS NOT NULL AND 
            owner_id = auth.uid() AND
            is_authenticated = true
        )
    );

-- trade_post_offered_cards テーブル
DROP POLICY IF EXISTS "Allow read offered cards" ON trade_post_offered_cards;
DROP POLICY IF EXISTS "Allow insert offered cards" ON trade_post_offered_cards;
DROP POLICY IF EXISTS "Allow update offered cards" ON trade_post_offered_cards;
DROP POLICY IF EXISTS "Allow delete offered cards" ON trade_post_offered_cards;
DROP POLICY IF EXISTS "offered_cards_select_policy" ON trade_post_offered_cards;
DROP POLICY IF EXISTS "offered_cards_insert_policy" ON trade_post_offered_cards;
DROP POLICY IF EXISTS "offered_cards_update_policy" ON trade_post_offered_cards;
DROP POLICY IF EXISTS "offered_cards_delete_policy" ON trade_post_offered_cards;

CREATE POLICY "offered_cards_allow_select" ON trade_post_offered_cards
    FOR SELECT USING (true);

CREATE POLICY "offered_cards_allow_insert" ON trade_post_offered_cards
    FOR INSERT WITH CHECK (
        post_id IS NOT NULL AND
        card_id IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM trade_posts 
            WHERE id = post_id AND (
                -- 認証済みユーザーの投稿
                (auth.uid() IS NOT NULL AND owner_id = auth.uid() AND is_authenticated = true) OR
                -- ゲストユーザーの投稿
                (auth.uid() IS NULL AND owner_id IS NULL AND is_authenticated = false)
            )
        )
    );

CREATE POLICY "offered_cards_allow_update" ON trade_post_offered_cards
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM trade_posts 
            WHERE id = post_id AND 
            auth.uid() IS NOT NULL AND 
            owner_id = auth.uid() AND
            is_authenticated = true
        )
    );

CREATE POLICY "offered_cards_allow_delete" ON trade_post_offered_cards
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM trade_posts 
            WHERE id = post_id AND 
            auth.uid() IS NOT NULL AND 
            owner_id = auth.uid() AND
            is_authenticated = true
        )
    );

-- デバッグ用: 現在の認証状態を確認
SELECT 
    'Current auth state:' as info,
    auth.uid() as current_user_id,
    auth.role() as current_role;

-- デバッグ用: 新しいポリシーを確認
SELECT 
    'New policies:' as info,
    tablename, 
    policyname, 
    cmd
FROM pg_policies 
WHERE tablename IN ('trade_posts', 'trade_post_wanted_cards', 'trade_post_offered_cards')
ORDER BY tablename, cmd, policyname;

-- テスト用: 挿入テスト（認証済みユーザー用）
-- 注意: 実際のユーザーIDに置き換えてください
/*
INSERT INTO trade_posts (
    title, 
    owner_id, 
    is_authenticated, 
    status
) VALUES (
    'テスト投稿', 
    auth.uid(), 
    true, 
    'active'
);
*/

-- テスト用: 挿入テスト（ゲストユーザー用）
/*
INSERT INTO trade_posts (
    title, 
    guest_name, 
    is_authenticated, 
    status
) VALUES (
    'ゲストテスト投稿', 
    'テストゲスト', 
    false, 
    'active'
);
*/

-- 制約の確認
SELECT 
    table_name,
    column_name,
    is_nullable,
    column_default,
    data_type
FROM information_schema.columns 
WHERE table_name = 'trade_posts' 
AND column_name IN ('owner_id', 'is_authenticated', 'guest_name', 'title', 'status')
ORDER BY ordinal_position;
