-- Fix UUID type mismatch in RLS policies

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view trade posts" ON trade_posts;
DROP POLICY IF EXISTS "Authenticated users can insert trade posts" ON trade_posts;
DROP POLICY IF EXISTS "Users can update their own trade posts" ON trade_posts;
DROP POLICY IF EXISTS "Users can delete their own trade posts" ON trade_posts;

-- Create new policies with proper UUID casting
CREATE POLICY "Anyone can view trade posts" ON trade_posts
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert trade posts" ON trade_posts
    FOR INSERT WITH CHECK (
        -- Allow if user is authenticated and owner_id matches, OR if it's a guest post
        (auth.uid() IS NOT NULL AND owner_id = auth.uid()) OR 
        (owner_id IS NULL AND guest_name IS NOT NULL)
    );

CREATE POLICY "Users can update their own trade posts" ON trade_posts
    FOR UPDATE USING (
        auth.uid() IS NOT NULL AND owner_id = auth.uid()
    );

CREATE POLICY "Users can delete their own trade posts" ON trade_posts
    FOR DELETE USING (
        auth.uid() IS NOT NULL AND owner_id = auth.uid()
    );

-- Fix policies for trade_post_wanted_cards table
DROP POLICY IF EXISTS "Anyone can view wanted cards" ON trade_post_wanted_cards;
DROP POLICY IF EXISTS "Authenticated users can insert wanted cards" ON trade_post_wanted_cards;
DROP POLICY IF EXISTS "Users can update their wanted cards" ON trade_post_wanted_cards;
DROP POLICY IF EXISTS "Users can delete their wanted cards" ON trade_post_wanted_cards;

CREATE POLICY "Anyone can view wanted cards" ON trade_post_wanted_cards
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert wanted cards" ON trade_post_wanted_cards
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM trade_posts 
            WHERE id = post_id AND (
                (owner_id = auth.uid() AND auth.uid() IS NOT NULL) OR
                (owner_id IS NULL AND guest_name IS NOT NULL)
            )
        )
    );

CREATE POLICY "Users can update their wanted cards" ON trade_post_wanted_cards
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM trade_posts 
            WHERE id = post_id AND owner_id = auth.uid() AND auth.uid() IS NOT NULL
        )
    );

CREATE POLICY "Users can delete their wanted cards" ON trade_post_wanted_cards
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM trade_posts 
            WHERE id = post_id AND owner_id = auth.uid() AND auth.uid() IS NOT NULL
        )
    );

-- Fix policies for trade_post_offered_cards table
DROP POLICY IF EXISTS "Anyone can view offered cards" ON trade_post_offered_cards;
DROP POLICY IF EXISTS "Authenticated users can insert offered cards" ON trade_post_offered_cards;
DROP POLICY IF EXISTS "Users can update their offered cards" ON trade_post_offered_cards;
DROP POLICY IF EXISTS "Users can delete their offered cards" ON trade_post_offered_cards;

CREATE POLICY "Anyone can view offered cards" ON trade_post_offered_cards
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert offered cards" ON trade_post_offered_cards
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM trade_posts 
            WHERE id = post_id AND (
                (owner_id = auth.uid() AND auth.uid() IS NOT NULL) OR
                (owner_id IS NULL AND guest_name IS NOT NULL)
            )
        )
    );

CREATE POLICY "Users can update their offered cards" ON trade_post_offered_cards
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM trade_posts 
            WHERE id = post_id AND owner_id = auth.uid() AND auth.uid() IS NOT NULL
        )
    );

CREATE POLICY "Users can delete their offered cards" ON trade_post_offered_cards
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM trade_posts 
            WHERE id = post_id AND owner_id = auth.uid() AND auth.uid() IS NOT NULL
        )
    );

-- Fix policies for trade_comments table
DROP POLICY IF EXISTS "Anyone can view comments" ON trade_comments;
DROP POLICY IF EXISTS "Authenticated users can insert comments" ON trade_comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON trade_comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON trade_comments;

CREATE POLICY "Anyone can view comments" ON trade_comments
    FOR SELECT USING (is_deleted = false);

CREATE POLICY "Authenticated users can insert comments" ON trade_comments
    FOR INSERT WITH CHECK (
        -- Allow if user is authenticated and user_id matches, OR if it's a guest comment
        (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR 
        (user_id IS NULL AND guest_name IS NOT NULL)
    );

CREATE POLICY "Users can update their own comments" ON trade_comments
    FOR UPDATE USING (
        auth.uid() IS NOT NULL AND user_id = auth.uid()
    );

CREATE POLICY "Users can delete their own comments" ON trade_comments
    FOR DELETE USING (
        auth.uid() IS NOT NULL AND user_id = auth.uid()
    );

-- Verify the policies were created successfully
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('trade_posts', 'trade_post_wanted_cards', 'trade_post_offered_cards', 'trade_comments')
ORDER BY tablename, policyname;
