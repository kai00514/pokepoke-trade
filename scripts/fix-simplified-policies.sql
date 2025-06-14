-- Drop existing policies and create simplified ones
DROP POLICY IF EXISTS "Authenticated users can insert trade posts" ON trade_posts;
DROP POLICY IF EXISTS "Allow guest insert" ON trade_posts;

-- Policy 1: Authenticated users can insert trade posts
CREATE POLICY "Authenticated users can insert trade posts" ON trade_posts
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND 
        owner_id IS NOT NULL AND 
        owner_id::text = auth.uid()::text AND
        is_authenticated = true
    );

-- Policy 2: Allow guest insert
CREATE POLICY "Allow guest insert" ON trade_posts
    FOR INSERT WITH CHECK (
        auth.uid() IS NULL AND 
        owner_id IS NULL AND 
        guest_name IS NOT NULL AND
        is_authenticated = false
    );

-- Update related table policies to match
DROP POLICY IF EXISTS "Authenticated users can insert wanted cards" ON trade_post_wanted_cards;
DROP POLICY IF EXISTS "Allow guest wanted cards insert" ON trade_post_wanted_cards;

CREATE POLICY "Authenticated users can insert wanted cards" ON trade_post_wanted_cards
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM trade_posts 
            WHERE id = post_id AND (
                (auth.uid() IS NOT NULL AND owner_id IS NOT NULL AND owner_id::text = auth.uid()::text) OR
                (auth.uid() IS NULL AND owner_id IS NULL AND guest_name IS NOT NULL)
            )
        )
    );

DROP POLICY IF EXISTS "Authenticated users can insert offered cards" ON trade_post_offered_cards;
DROP POLICY IF EXISTS "Allow guest offered cards insert" ON trade_post_offered_cards;

CREATE POLICY "Authenticated users can insert offered cards" ON trade_post_offered_cards
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM trade_posts 
            WHERE id = post_id AND (
                (auth.uid() IS NOT NULL AND owner_id IS NOT NULL AND owner_id::text = auth.uid()::text) OR
                (auth.uid() IS NULL AND owner_id IS NULL AND guest_name IS NOT NULL)
            )
        )
    );

-- Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('trade_posts', 'trade_post_wanted_cards', 'trade_post_offered_cards')
AND policyname LIKE '%insert%'
ORDER BY tablename, policyname;
