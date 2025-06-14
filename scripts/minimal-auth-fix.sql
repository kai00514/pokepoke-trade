-- Add only essential columns for guest posting without changing existing schema
ALTER TABLE trade_posts 
ADD COLUMN IF NOT EXISTS guest_name TEXT,
ADD COLUMN IF NOT EXISTS is_authenticated BOOLEAN DEFAULT true;

ALTER TABLE trade_comments 
ADD COLUMN IF NOT EXISTS guest_name TEXT,
ADD COLUMN IF NOT EXISTS is_guest BOOLEAN DEFAULT false;

-- Add guest_name column to decks table for deck posting
ALTER TABLE decks 
ADD COLUMN IF NOT EXISTS guest_name TEXT;

-- Drop existing policies that might conflict (ignore errors if they don't exist)
DROP POLICY IF EXISTS "Anyone can view trade posts" ON trade_posts;
DROP POLICY IF EXISTS "Anyone can insert trade posts" ON trade_posts;
DROP POLICY IF EXISTS "Users can update their own trade posts" ON trade_posts;
DROP POLICY IF EXISTS "Users can delete their own trade posts" ON trade_posts;

DROP POLICY IF EXISTS "Anyone can view wanted cards" ON trade_post_wanted_cards;
DROP POLICY IF EXISTS "Anyone can insert wanted cards" ON trade_post_wanted_cards;
DROP POLICY IF EXISTS "Users can update their wanted cards" ON trade_post_wanted_cards;
DROP POLICY IF EXISTS "Users can delete their wanted cards" ON trade_post_wanted_cards;

DROP POLICY IF EXISTS "Anyone can view offered cards" ON trade_post_offered_cards;
DROP POLICY IF EXISTS "Anyone can insert offered cards" ON trade_post_offered_cards;
DROP POLICY IF EXISTS "Users can update their offered cards" ON trade_post_offered_cards;
DROP POLICY IF EXISTS "Users can delete their offered cards" ON trade_post_offered_cards;

DROP POLICY IF EXISTS "Anyone can view comments" ON trade_comments;
DROP POLICY IF EXISTS "Anyone can insert comments" ON trade_comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON trade_comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON trade_comments;

-- Create simple policies that allow both authenticated and anonymous users
-- Trade Posts policies
CREATE POLICY "trade_posts_select_policy" ON trade_posts
    FOR SELECT USING (true);

CREATE POLICY "trade_posts_insert_policy" ON trade_posts
    FOR INSERT WITH CHECK (true);

CREATE POLICY "trade_posts_update_policy" ON trade_posts
    FOR UPDATE USING (
        CASE 
            WHEN auth.uid() IS NOT NULL THEN 
                owner_id::text = auth.uid()::text
            ELSE 
                is_authenticated = false
        END
    );

CREATE POLICY "trade_posts_delete_policy" ON trade_posts
    FOR DELETE USING (
        CASE 
            WHEN auth.uid() IS NOT NULL THEN 
                owner_id::text = auth.uid()::text
            ELSE 
                is_authenticated = false
        END
    );

-- Trade Post Wanted Cards policies
CREATE POLICY "wanted_cards_select_policy" ON trade_post_wanted_cards
    FOR SELECT USING (true);

CREATE POLICY "wanted_cards_insert_policy" ON trade_post_wanted_cards
    FOR INSERT WITH CHECK (true);

CREATE POLICY "wanted_cards_update_policy" ON trade_post_wanted_cards
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM trade_posts 
            WHERE id = post_id AND (
                CASE 
                    WHEN auth.uid() IS NOT NULL THEN 
                        owner_id::text = auth.uid()::text
                    ELSE 
                        is_authenticated = false
                END
            )
        )
    );

CREATE POLICY "wanted_cards_delete_policy" ON trade_post_wanted_cards
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM trade_posts 
            WHERE id = post_id AND (
                CASE 
                    WHEN auth.uid() IS NOT NULL THEN 
                        owner_id::text = auth.uid()::text
                    ELSE 
                        is_authenticated = false
                END
            )
        )
    );

-- Trade Post Offered Cards policies
CREATE POLICY "offered_cards_select_policy" ON trade_post_offered_cards
    FOR SELECT USING (true);

CREATE POLICY "offered_cards_insert_policy" ON trade_post_offered_cards
    FOR INSERT WITH CHECK (true);

CREATE POLICY "offered_cards_update_policy" ON trade_post_offered_cards
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM trade_posts 
            WHERE id = post_id AND (
                CASE 
                    WHEN auth.uid() IS NOT NULL THEN 
                        owner_id::text = auth.uid()::text
                    ELSE 
                        is_authenticated = false
                END
            )
        )
    );

CREATE POLICY "offered_cards_delete_policy" ON trade_post_offered_cards
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM trade_posts 
            WHERE id = post_id AND (
                CASE 
                    WHEN auth.uid() IS NOT NULL THEN 
                        owner_id::text = auth.uid()::text
                    ELSE 
                        is_authenticated = false
                END
            )
        )
    );

-- Trade Comments policies
CREATE POLICY "comments_select_policy" ON trade_comments
    FOR SELECT USING (is_deleted = false);

CREATE POLICY "comments_insert_policy" ON trade_comments
    FOR INSERT WITH CHECK (true);

CREATE POLICY "comments_update_policy" ON trade_comments
    FOR UPDATE USING (
        CASE 
            WHEN auth.uid() IS NOT NULL THEN 
                user_id::text = auth.uid()::text
            ELSE 
                is_guest = true
        END
    );

CREATE POLICY "comments_delete_policy" ON trade_comments
    FOR DELETE USING (
        CASE 
            WHEN auth.uid() IS NOT NULL THEN 
                user_id::text = auth.uid()::text
            ELSE 
                is_guest = true
        END
    );

-- Decks policies (if RLS is enabled)
DROP POLICY IF EXISTS "decks_select_policy" ON decks;
DROP POLICY IF EXISTS "decks_insert_policy" ON decks;
DROP POLICY IF EXISTS "decks_update_policy" ON decks;
DROP POLICY IF EXISTS "decks_delete_policy" ON decks;

CREATE POLICY "decks_select_policy" ON decks
    FOR SELECT USING (is_public = true OR 
        CASE 
            WHEN auth.uid() IS NOT NULL THEN 
                user_id::text = auth.uid()::text
            ELSE 
                false
        END
    );

CREATE POLICY "decks_insert_policy" ON decks
    FOR INSERT WITH CHECK (true);

CREATE POLICY "decks_update_policy" ON decks
    FOR UPDATE USING (
        CASE 
            WHEN auth.uid() IS NOT NULL THEN 
                user_id::text = auth.uid()::text
            ELSE 
                user_id IS NULL
        END
    );

CREATE POLICY "decks_delete_policy" ON decks
    FOR DELETE USING (
        CASE 
            WHEN auth.uid() IS NOT NULL THEN 
                user_id::text = auth.uid()::text
            ELSE 
                user_id IS NULL
        END
    );

-- Deck Cards policies
DROP POLICY IF EXISTS "deck_cards_select_policy" ON deck_cards;
DROP POLICY IF EXISTS "deck_cards_insert_policy" ON deck_cards;
DROP POLICY IF EXISTS "deck_cards_update_policy" ON deck_cards;
DROP POLICY IF EXISTS "deck_cards_delete_policy" ON deck_cards;

CREATE POLICY "deck_cards_select_policy" ON deck_cards
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM decks 
            WHERE id = deck_id AND (
                is_public = true OR 
                CASE 
                    WHEN auth.uid() IS NOT NULL THEN 
                        user_id::text = auth.uid()::text
                    ELSE 
                        false
                END
            )
        )
    );

CREATE POLICY "deck_cards_insert_policy" ON deck_cards
    FOR INSERT WITH CHECK (true);

CREATE POLICY "deck_cards_update_policy" ON deck_cards
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM decks 
            WHERE id = deck_id AND (
                CASE 
                    WHEN auth.uid() IS NOT NULL THEN 
                        user_id::text = auth.uid()::text
                    ELSE 
                        user_id IS NULL
                END
            )
        )
    );

CREATE POLICY "deck_cards_delete_policy" ON deck_cards
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM decks 
            WHERE id = deck_id AND (
                CASE 
                    WHEN auth.uid() IS NOT NULL THEN 
                        user_id::text = auth.uid()::text
                    ELSE 
                        user_id IS NULL
                END
            )
        )
    );
