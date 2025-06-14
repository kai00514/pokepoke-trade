-- Add guest_name column to trade_posts table if it doesn't exist
ALTER TABLE trade_posts 
ADD COLUMN IF NOT EXISTS guest_name TEXT,
ADD COLUMN IF NOT EXISTS is_authenticated BOOLEAN DEFAULT true;

-- Add guest_name column to trade_comments table if it doesn't exist  
ALTER TABLE trade_comments 
ADD COLUMN IF NOT EXISTS guest_name TEXT,
ADD COLUMN IF NOT EXISTS is_guest BOOLEAN DEFAULT false;

-- Update RLS policies to allow guest posting
-- Trade posts policies
DROP POLICY IF EXISTS "Anyone can view trade posts" ON trade_posts;
DROP POLICY IF EXISTS "Authenticated users can insert trade posts" ON trade_posts;
DROP POLICY IF EXISTS "Users can update their own trade posts" ON trade_posts;
DROP POLICY IF EXISTS "Users can delete their own trade posts" ON trade_posts;

CREATE POLICY "Anyone can view trade posts" ON trade_posts
    FOR SELECT USING (true);

CREATE POLICY "Anyone can insert trade posts" ON trade_posts
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own trade posts" ON trade_posts
    FOR UPDATE USING (
        (auth.uid() IS NOT NULL AND auth.uid() = owner_id) OR 
        (auth.uid() IS NULL AND is_authenticated = false)
    );

CREATE POLICY "Users can delete their own trade posts" ON trade_posts
    FOR DELETE USING (
        (auth.uid() IS NOT NULL AND auth.uid() = owner_id) OR 
        (auth.uid() IS NULL AND is_authenticated = false)
    );

-- Trade post wanted cards policies
DROP POLICY IF EXISTS "Anyone can view wanted cards" ON trade_post_wanted_cards;
DROP POLICY IF EXISTS "Authenticated users can insert wanted cards" ON trade_post_wanted_cards;
DROP POLICY IF EXISTS "Users can update their wanted cards" ON trade_post_wanted_cards;
DROP POLICY IF EXISTS "Users can delete their wanted cards" ON trade_post_wanted_cards;

CREATE POLICY "Anyone can view wanted cards" ON trade_post_wanted_cards
    FOR SELECT USING (true);

CREATE POLICY "Anyone can insert wanted cards" ON trade_post_wanted_cards
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their wanted cards" ON trade_post_wanted_cards
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM trade_posts 
            WHERE id = post_id AND (
                (auth.uid() IS NOT NULL AND owner_id = auth.uid()) OR
                (auth.uid() IS NULL AND is_authenticated = false)
            )
        )
    );

CREATE POLICY "Users can delete their wanted cards" ON trade_post_wanted_cards
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM trade_posts 
            WHERE id = post_id AND (
                (auth.uid() IS NOT NULL AND owner_id = auth.uid()) OR
                (auth.uid() IS NULL AND is_authenticated = false)
            )
        )
    );

-- Trade post offered cards policies
DROP POLICY IF EXISTS "Anyone can view offered cards" ON trade_post_offered_cards;
DROP POLICY IF EXISTS "Authenticated users can insert offered cards" ON trade_post_offered_cards;
DROP POLICY IF EXISTS "Users can update their offered cards" ON trade_post_offered_cards;
DROP POLICY IF EXISTS "Users can delete their offered cards" ON trade_post_offered_cards;

CREATE POLICY "Anyone can view offered cards" ON trade_post_offered_cards
    FOR SELECT USING (true);

CREATE POLICY "Anyone can insert offered cards" ON trade_post_offered_cards
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their offered cards" ON trade_post_offered_cards
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM trade_posts 
            WHERE id = post_id AND (
                (auth.uid() IS NOT NULL AND owner_id = auth.uid()) OR
                (auth.uid() IS NULL AND is_authenticated = false)
            )
        )
    );

CREATE POLICY "Users can delete their offered cards" ON trade_post_offered_cards
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM trade_posts 
            WHERE id = post_id AND (
                (auth.uid() IS NOT NULL AND owner_id = auth.uid()) OR
                (auth.uid() IS NULL AND is_authenticated = false)
            )
        )
    );

-- Trade comments policies
DROP POLICY IF EXISTS "Anyone can view comments" ON trade_comments;
DROP POLICY IF EXISTS "Authenticated users can insert comments" ON trade_comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON trade_comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON trade_comments;

CREATE POLICY "Anyone can view comments" ON trade_comments
    FOR SELECT USING (is_deleted = false);

CREATE POLICY "Anyone can insert comments" ON trade_comments
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own comments" ON trade_comments
    FOR UPDATE USING (
        (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR
        (auth.uid() IS NULL AND is_guest = true)
    );

CREATE POLICY "Users can delete their own comments" ON trade_comments
    FOR DELETE USING (
        (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR
        (auth.uid() IS NULL AND is_guest = true)
    );
