-- Allow guest users to post trades and comments
-- Update RLS policies to allow anonymous users

-- Update trade_posts policies to allow anonymous posting
DROP POLICY IF EXISTS "Authenticated users can insert trade posts" ON trade_posts;
CREATE POLICY "Anyone can insert trade posts" ON trade_posts
    FOR INSERT WITH CHECK (true);

-- Update trade_post_wanted_cards policies
DROP POLICY IF EXISTS "Authenticated users can insert wanted cards" ON trade_post_wanted_cards;
CREATE POLICY "Anyone can insert wanted cards" ON trade_post_wanted_cards
    FOR INSERT WITH CHECK (true);

-- Update trade_post_offered_cards policies  
DROP POLICY IF EXISTS "Authenticated users can insert offered cards" ON trade_post_offered_cards;
CREATE POLICY "Anyone can insert offered cards" ON trade_post_offered_cards
    FOR INSERT WITH CHECK (true);

-- Update trade_comments policies to allow anonymous comments
DROP POLICY IF EXISTS "Authenticated users can insert comments" ON trade_comments;
CREATE POLICY "Anyone can insert comments" ON trade_comments
    FOR INSERT WITH CHECK (true);

-- Update decks policies to allow anonymous deck creation
DROP POLICY IF EXISTS "Users can insert their own deck" ON decks;
CREATE POLICY "Anyone can insert decks" ON decks
    FOR INSERT WITH CHECK (true);

-- Update deck_cards policies
DROP POLICY IF EXISTS "Users can insert deck cards" ON deck_cards;
CREATE POLICY "Anyone can insert deck cards" ON deck_cards
    FOR INSERT WITH CHECK (true);

-- Add guest_name column to trade_posts for guest user identification
ALTER TABLE trade_posts ADD COLUMN IF NOT EXISTS guest_name TEXT;

-- Add guest_name column to trade_comments for guest user identification  
ALTER TABLE trade_comments ADD COLUMN IF NOT EXISTS guest_name TEXT;

-- Add guest_name column to decks for guest user identification
ALTER TABLE decks ADD COLUMN IF NOT EXISTS guest_name TEXT;
