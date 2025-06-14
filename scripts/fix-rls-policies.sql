-- Fix RLS policies for trade_posts table

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all trade posts" ON trade_posts;
DROP POLICY IF EXISTS "Users can insert their own trade posts" ON trade_posts;
DROP POLICY IF EXISTS "Users can update their own trade posts" ON trade_posts;
DROP POLICY IF EXISTS "Users can delete their own trade posts" ON trade_posts;

-- Create new policies for trade_posts
CREATE POLICY "Anyone can view trade posts" ON trade_posts
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert trade posts" ON trade_posts
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own trade posts" ON trade_posts
    FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own trade posts" ON trade_posts
    FOR DELETE USING (auth.uid() = owner_id);

-- Fix RLS policies for trade_post_wanted_cards table
DROP POLICY IF EXISTS "Users can view wanted cards" ON trade_post_wanted_cards;
DROP POLICY IF EXISTS "Users can insert wanted cards" ON trade_post_wanted_cards;
DROP POLICY IF EXISTS "Users can update wanted cards" ON trade_post_wanted_cards;
DROP POLICY IF EXISTS "Users can delete wanted cards" ON trade_post_wanted_cards;

CREATE POLICY "Anyone can view wanted cards" ON trade_post_wanted_cards
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert wanted cards" ON trade_post_wanted_cards
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM trade_posts 
            WHERE id = post_id AND owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their wanted cards" ON trade_post_wanted_cards
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM trade_posts 
            WHERE id = post_id AND owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their wanted cards" ON trade_post_wanted_cards
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM trade_posts 
            WHERE id = post_id AND owner_id = auth.uid()
        )
    );

-- Fix RLS policies for trade_post_offered_cards table
DROP POLICY IF EXISTS "Users can view offered cards" ON trade_post_offered_cards;
DROP POLICY IF EXISTS "Users can insert offered cards" ON trade_post_offered_cards;
DROP POLICY IF EXISTS "Users can update offered cards" ON trade_post_offered_cards;
DROP POLICY IF EXISTS "Users can delete offered cards" ON trade_post_offered_cards;

CREATE POLICY "Anyone can view offered cards" ON trade_post_offered_cards
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert offered cards" ON trade_post_offered_cards
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM trade_posts 
            WHERE id = post_id AND owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their offered cards" ON trade_post_offered_cards
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM trade_posts 
            WHERE id = post_id AND owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their offered cards" ON trade_post_offered_cards
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM trade_posts 
            WHERE id = post_id AND owner_id = auth.uid()
        )
    );

-- Fix RLS policies for trade_comments table
DROP POLICY IF EXISTS "Users can view comments" ON trade_comments;
DROP POLICY IF EXISTS "Users can insert comments" ON trade_comments;
DROP POLICY IF EXISTS "Users can update their comments" ON trade_comments;
DROP POLICY IF EXISTS "Users can delete their comments" ON trade_comments;

CREATE POLICY "Anyone can view comments" ON trade_comments
    FOR SELECT USING (is_deleted = false);

CREATE POLICY "Authenticated users can insert comments" ON trade_comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" ON trade_comments
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON trade_comments
    FOR DELETE USING (auth.uid() = user_id);
