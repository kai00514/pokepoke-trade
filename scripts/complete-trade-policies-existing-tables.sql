-- 既存テーブルの確認
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('trade_posts', 'trade_post_wanted_cards', 'trade_post_offered_cards', 'deck_posts');

-- Drop all existing policies for trade_posts and related tables
DROP POLICY IF EXISTS "Authenticated users can insert trade posts" ON trade_posts;
DROP POLICY IF EXISTS "Allow guest insert" ON trade_posts;
DROP POLICY IF EXISTS "Allow read access to trade posts" ON trade_posts;
DROP POLICY IF EXISTS "Allow update for owners" ON trade_posts;
DROP POLICY IF EXISTS "Allow delete for owners" ON trade_posts;

-- Drop policies for related tables (if they exist)
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

-- INSERT: 認証済みユーザーの投稿（is_authenticated必須チェック付き）
CREATE POLICY "Authenticated users can insert trade posts" ON trade_posts
    FOR INSERT WITH CHECK (
        -- 認証状態の確認
        auth.uid() IS NOT NULL AND 
        -- owner_idが正しく設定されている
        owner_id IS NOT NULL AND 
        owner_id::text = auth.uid()::text AND
        -- is_authenticatedが必須でtrueに設定されている
        is_authenticated IS NOT NULL AND
        is_authenticated = true AND
        -- guest_nameは認証済みユーザーでは不要
        guest_name IS NULL AND
        -- 必須フィールドのチェック
        title IS NOT NULL AND
        title != '' AND
        status IS NOT NULL
    );

-- INSERT: ゲストユーザーの投稿（is_authenticated必須チェック付き）
CREATE POLICY "Allow guest insert" ON trade_posts
    FOR INSERT WITH CHECK (
        -- 非認証状態の確認（auth.uid()がNULLまたは認証なし）
        (auth.uid() IS NULL OR auth.role() = 'anon') AND 
        -- owner_idはゲストではNULL
        owner_id IS NULL AND 
        -- guest_nameが必須
        guest_name IS NOT NULL AND
        guest_name != '' AND
        -- is_authenticatedが必須でfalseに設定されている
        is_authenticated IS NOT NULL AND
        is_authenticated = false AND
        -- 必須フィールドのチェック
        title IS NOT NULL AND
        title != '' AND
        status IS NOT NULL
    );

-- UPDATE: 認証済みユーザーは自分の投稿のみ編集可能（is_authenticatedの整合性チェック付き）
CREATE POLICY "Allow update for authenticated owners" ON trade_posts
    FOR UPDATE USING (
        auth.uid() IS NOT NULL AND 
        owner_id IS NOT NULL AND 
        owner_id::text = auth.uid()::text AND
        is_authenticated = true
    ) WITH CHECK (
        -- 更新後も整合性を保つ
        auth.uid() IS NOT NULL AND 
        owner_id IS NOT NULL AND 
        owner_id::text = auth.uid()::text AND
        is_authenticated IS NOT NULL AND
        is_authenticated = true AND
        guest_name IS NULL AND
        title IS NOT NULL AND
        title != '' AND
        status IS NOT NULL
    );

-- DELETE: 認証済みユーザーは自分の投稿のみ削除可能
CREATE POLICY "Allow delete for authenticated owners" ON trade_posts
    FOR DELETE USING (
        auth.uid() IS NOT NULL AND 
        owner_id IS NOT NULL AND 
        owner_id::text = auth.uid()::text AND
        is_authenticated = true
    );

-- ===== TRADE_POST_WANTED_CARDS TABLE POLICIES (テーブルが存在する場合のみ) =====

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trade_post_wanted_cards') THEN
        -- SELECT: 全ての欲しいカードを誰でも読み取り可能
        EXECUTE 'CREATE POLICY "Allow read wanted cards" ON trade_post_wanted_cards FOR SELECT USING (true)';

        -- INSERT: 投稿の所有者のみ追加可能（必須フィールドチェック付き）
        EXECUTE 'CREATE POLICY "Allow insert wanted cards" ON trade_post_wanted_cards
            FOR INSERT WITH CHECK (
                post_id IS NOT NULL AND
                card_id IS NOT NULL AND
                EXISTS (
                    SELECT 1 FROM trade_posts 
                    WHERE id = post_id AND (
                        (auth.uid() IS NOT NULL AND owner_id IS NOT NULL AND owner_id::text = auth.uid()::text AND is_authenticated = true) OR
                        (auth.uid() IS NULL AND owner_id IS NULL AND guest_name IS NOT NULL AND is_authenticated = false)
                    )
                )
            )';

        -- UPDATE: 認証済み投稿の所有者のみ編集可能
        EXECUTE 'CREATE POLICY "Allow update wanted cards" ON trade_post_wanted_cards
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
                post_id IS NOT NULL AND
                card_id IS NOT NULL AND
                EXISTS (
                    SELECT 1 FROM trade_posts 
                    WHERE id = post_id AND 
                    auth.uid() IS NOT NULL AND 
                    owner_id IS NOT NULL AND 
                    owner_id::text = auth.uid()::text AND
                    is_authenticated = true
                )
            )';

        -- DELETE: 認証済み投稿の所有者のみ削除可能
        EXECUTE 'CREATE POLICY "Allow delete wanted cards" ON trade_post_wanted_cards
            FOR DELETE USING (
                EXISTS (
                    SELECT 1 FROM trade_posts 
                    WHERE id = post_id AND 
                    auth.uid() IS NOT NULL AND 
                    owner_id IS NOT NULL AND 
                    owner_id::text = auth.uid()::text AND
                    is_authenticated = true
                )
            )';
    END IF;
END $$;

-- ===== TRADE_POST_OFFERED_CARDS TABLE POLICIES (テーブルが存在する場合のみ) =====

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trade_post_offered_cards') THEN
        -- SELECT: 全ての提供カードを誰でも読み取り可能
        EXECUTE 'CREATE POLICY "Allow read offered cards" ON trade_post_offered_cards FOR SELECT USING (true)';

        -- INSERT: 投稿の所有者のみ追加可能（必須フィールドチェック付き）
        EXECUTE 'CREATE POLICY "Allow insert offered cards" ON trade_post_offered_cards
            FOR INSERT WITH CHECK (
                post_id IS NOT NULL AND
                card_id IS NOT NULL AND
                EXISTS (
                    SELECT 1 FROM trade_posts 
                    WHERE id = post_id AND (
                        (auth.uid() IS NOT NULL AND owner_id IS NOT NULL AND owner_id::text = auth.uid()::text AND is_authenticated = true) OR
                        (auth.uid() IS NULL AND owner_id IS NULL AND guest_name IS NOT NULL AND is_authenticated = false)
                    )
                )
            )';

        -- UPDATE: 認証済み投稿の所有者のみ編集可能
        EXECUTE 'CREATE POLICY "Allow update offered cards" ON trade_post_offered_cards
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
                post_id IS NOT NULL AND
                card_id IS NOT NULL AND
                EXISTS (
                    SELECT 1 FROM trade_posts 
                    WHERE id = post_id AND 
                    auth.uid() IS NOT NULL AND 
                    owner_id IS NOT NULL AND 
                    owner_id::text = auth.uid()::text AND
                    is_authenticated = true
                )
            )';

        -- DELETE: 認証済み投稿の所有者のみ削除可能
        EXECUTE 'CREATE POLICY "Allow delete offered cards" ON trade_post_offered_cards
            FOR DELETE USING (
                EXISTS (
                    SELECT 1 FROM trade_posts 
                    WHERE id = post_id AND 
                    auth.uid() IS NOT NULL AND 
                    owner_id IS NOT NULL AND 
                    owner_id::text = auth.uid()::text AND
                    is_authenticated = true
                )
            )';
    END IF;
END $$;

-- ===== データベース制約の追加 =====

-- is_authenticated列にNOT NULL制約を追加（まだ設定されていない場合）
DO $$
BEGIN
    -- trade_postsテーブル
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'trade_posts' 
        AND column_name = 'is_authenticated' 
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE trade_posts ALTER COLUMN is_authenticated SET NOT NULL;
    END IF;
END $$;

-- デフォルト値の設定
ALTER TABLE trade_posts ALTER COLUMN is_authenticated SET DEFAULT false;

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
WHERE tablename IN ('trade_posts', 'trade_post_wanted_cards', 'trade_post_offered_cards')
ORDER BY tablename, cmd, policyname;

-- Show summary
SELECT 
    tablename,
    cmd,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename IN ('trade_posts', 'trade_post_wanted_cards', 'trade_post_offered_cards')
GROUP BY tablename, cmd
ORDER BY tablename, cmd;

-- Check column constraints
SELECT 
    table_name,
    column_name,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'trade_posts' 
AND column_name = 'is_authenticated';

-- Show existing tables
SELECT 'Existing tables:' as info;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%trade%' OR table_name LIKE '%deck%'
ORDER BY table_name;
