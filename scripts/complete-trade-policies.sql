-- Drop all existing policies for trade_posts and related tables
DROP POLICY IF EXISTS "Authenticated users can insert trade posts" ON trade_posts;
DROP POLICY IF EXISTS "Allow guest insert" ON trade_posts;
DROP POLICY IF EXISTS "Allow read access to trade posts" ON trade_posts;
DROP POLICY IF EXISTS "Allow update for owners" ON trade_posts;
DROP POLICY IF EXISTS "Allow delete for owners" ON trade_posts;

-- Drop policies for related tables
DROP POLICY IF EXISTS "Authenticated users can insert wanted cards" ON trade_post_wanted_cards;
DROP POLICY IF EXISTS "Allow guest wanted cards insert" ON trade_post_wanted_cards;
DROP POLICY IF EXISTS "Allow read wanted cards" ON trade_post_wanted_cards;
DROP POLICY IF EXISTS "Allow update wanted cards" ON trade_post_wanted_cards;
DROP POLICY IF EXISTS "Allow delete wanted cards" ON trade_post_wanted_cards;

DROP POLICY IF EXISTS "Authenticated users can insert offered cards" ON trade_post_offered_cards;
DROP POLICY IF EXISTS "Allow guest offered cards insert" ON trade_post_offered_cards;
DROP POLICY IF EXISTS "Allow read offered cards" ON trade_post_offered_cards;
DROP POLICY IF EXISTS "Allow update offered cards" ON trade_post_offered_cards;
DROP POLICY IF EXISTS "Allow delete offered cards" ON trade_post_offered_cards;

-- ===== TRADE_POSTS TABLE POLICIES =====

-- SELECT: 全ての投稿を誰でも読み取り可能
CREATE POLICY "Allow read access to trade posts" ON trade_posts
    FOR SELECT USING (true);

-- INSERT: 認証済みユーザーの投稿
CREATE POLICY "Authenticated users can insert trade posts" ON trade_posts
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND 
        owner_id IS NOT NULL AND 
        owner_id::text = auth.uid()::text AND
        is_authenticated = true
    );

-- INSERT: ゲストユーザーの投稿
CREATE POLICY "Allow guest insert" ON trade_posts
    FOR INSERT WITH CHECK (
        auth.uid() IS NULL AND 
        owner_id IS NULL AND 
        guest_name IS NOT NULL AND
        is_authenticated = false
    );

-- UPDATE: 認証済みユーザーは自分の投稿のみ編集可能
CREATE POLICY "Allow update for authenticated owners" ON trade_posts
    FOR UPDATE USING (
        auth.uid() IS NOT NULL AND 
        owner_id IS NOT NULL AND 
        owner_id::text = auth.uid()::text AND
        is_authenticated = true
    ) WITH CHECK (
        auth.uid() IS NOT NULL AND 
        owner_id IS NOT NULL AND 
        owner_id::text = auth.uid()::text AND
        is_authenticated = true
    );

-- UPDATE: ゲスト投稿は編集不可（セキュリティ上の理由）
-- ゲスト投稿の編集を許可する場合は、セッション管理などの仕組みが必要

-- DELETE: 認証済みユーザーは自分の投稿のみ削除可能
CREATE POLICY "Allow delete for authenticated owners" ON trade_posts
    FOR DELETE USING (
        auth.uid() IS NOT NULL AND 
        owner_id IS NOT NULL AND 
        owner_id::text = auth.uid()::text AND
        is_authenticated = true
    );

-- DELETE: ゲスト投稿は削除不可（セキュリティ上の理由）

-- ===== TRADE_POST_WANTED_CARDS TABLE POLICIES =====

-- SELECT: 全ての欲しいカードを誰でも読み取り可能
CREATE POLICY "Allow read wanted cards" ON trade_post_wanted_cards
    FOR SELECT USING (true);

-- INSERT: 投稿の所有者のみ追加可能
CREATE POLICY "Allow insert wanted cards" ON trade_post_wanted_cards
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM trade_posts 
            WHERE id = post_id AND (
                (auth.uid() IS NOT NULL AND owner_id IS NOT NULL AND owner_id::text = auth.uid()::text) OR
                (auth.uid() IS NULL AND owner_id IS NULL AND guest_name IS NOT NULL)
            )
        )
    );

-- UPDATE: 認証済み投稿の所有者のみ編集可能
CREATE POLICY "Allow update wanted cards" ON trade_post_wanted_cards
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM trade_posts 
            WHERE id = post_id AND 
            auth.uid() IS NOT NULL AND 
            owner_id IS NOT NULL AND 
            owner_id::text = auth.uid()::text AND
            is_authenticated = true
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM trade_posts 
            WHERE id = post_id AND 
            auth.uid() IS NOT NULL AND 
            owner_id IS NOT NULL AND 
            owner_id::text = auth.uid()::text AND
            is_authenticated = true
        )
    );

-- DELETE: 認証済み投稿の所有者のみ削除可能
CREATE POLICY "Allow delete wanted cards" ON trade_post_wanted_cards
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM trade_posts 
            WHERE id = post_id AND 
            auth.uid() IS NOT NULL AND 
            owner_id IS NOT NULL AND 
            owner_id::text = auth.uid()::text AND
            is_authenticated = true
        )
    );

-- ===== TRADE_POST_OFFERED_CARDS TABLE POLICIES =====

-- SELECT: 全ての提供カードを誰でも読み取り可能
CREATE POLICY "Allow read offered cards" ON trade_post_offered_cards
    FOR SELECT USING (true);

-- INSERT: 投稿の所有者のみ追加可能
CREATE POLICY "Allow insert offered cards" ON trade_post_offered_cards
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM trade_posts 
            WHERE id = post_id AND (
                (auth.uid() IS NOT NULL AND owner_id IS NOT NULL AND owner_id::text = auth.uid()::text) OR
                (auth.uid() IS NULL AND owner_id IS NULL AND guest_name IS NOT NULL)
            )
        )
    );

-- UPDATE: 認証済み投稿の所有者のみ編集可能
CREATE POLICY "Allow update offered cards" ON trade_post_offered_cards
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM trade_posts 
            WHERE id = post_id AND 
            auth.uid() IS NOT NULL AND 
            owner_id IS NOT NULL AND 
            owner_id::text = auth.uid()::text AND
            is_authenticated = true
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM trade_posts 
            WHERE id = post_id AND 
            auth.uid() IS NOT NULL AND 
            owner_id IS NOT NULL AND 
            owner_id::text = auth.uid()::text AND
            is_authenticated = true
        )
    );

-- DELETE: 認証済み投稿の所有者のみ削除可能
CREATE POLICY "Allow delete offered cards" ON trade_post_offered_cards
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM trade_posts 
            WHERE id = post_id AND 
            auth.uid() IS NOT NULL AND 
            owner_id IS NOT NULL AND 
            owner_id::text = auth.uid()::text AND
            is_authenticated = true
        )
    );

-- ===== DECK_POSTS TABLE POLICIES (同様に設定) =====

-- Drop existing deck policies
DROP POLICY IF EXISTS "Allow read deck posts" ON deck_posts;
DROP POLICY IF EXISTS "Allow insert deck posts" ON deck_posts;
DROP POLICY IF EXISTS "Allow update deck posts" ON deck_posts;
DROP POLICY IF EXISTS "Allow delete deck posts" ON deck_posts;

-- SELECT: 全てのデッキ投稿を誰でも読み取り可能
CREATE POLICY "Allow read deck posts" ON deck_posts
    FOR SELECT USING (true);

-- INSERT: 認証済みユーザーの投稿
CREATE POLICY "Allow authenticated insert deck posts" ON deck_posts
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND 
        owner_id IS NOT NULL AND 
        owner_id::text = auth.uid()::text AND
        is_authenticated = true
    );

-- INSERT: ゲストユーザーの投稿
CREATE POLICY "Allow guest insert deck posts" ON deck_posts
    FOR INSERT WITH CHECK (
        auth.uid() IS NULL AND 
        owner_id IS NULL AND 
        guest_name IS NOT NULL AND
        is_authenticated = false
    );

-- UPDATE: 認証済みユーザーは自分の投稿のみ編集可能
CREATE POLICY "Allow update deck posts" ON deck_posts
    FOR UPDATE USING (
        auth.uid() IS NOT NULL AND 
        owner_id IS NOT NULL AND 
        owner_id::text = auth.uid()::text AND
        is_authenticated = true
    ) WITH CHECK (
        auth.uid() IS NOT NULL AND 
        owner_id IS NOT NULL AND 
        owner_id::text = auth.uid()::text AND
        is_authenticated = true
    );

-- DELETE: 認証済みユーザーは自分の投稿のみ削除可能
CREATE POLICY "Allow delete deck posts" ON deck_posts
    FOR DELETE USING (
        auth.uid() IS NOT NULL AND 
        owner_id IS NOT NULL AND 
        owner_id::text = auth.uid()::text AND
        is_authenticated = true
    );

-- Verify all policies
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
WHERE tablename IN ('trade_posts', 'trade_post_wanted_cards', 'trade_post_offered_cards', 'deck_posts')
ORDER BY tablename, cmd, policyname;

-- Show summary
SELECT 
    tablename,
    cmd,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename IN ('trade_posts', 'trade_post_wanted_cards', 'trade_post_offered_cards', 'deck_posts')
GROUP BY tablename, cmd
ORDER BY tablename, cmd;
