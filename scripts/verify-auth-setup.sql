-- Verify that all necessary columns exist and have correct types
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('trade_posts', 'trade_comments', 'decks') 
    AND column_name IN ('owner_id', 'user_id', 'guest_name', 'is_authenticated', 'is_guest')
ORDER BY table_name, column_name;

-- Check current RLS policies
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
WHERE tablename IN ('trade_posts', 'trade_comments', 'decks', 'deck_cards', 'trade_post_wanted_cards', 'trade_post_offered_cards')
ORDER BY tablename, policyname;

-- Test data insertion capabilities
DO $$
BEGIN
    -- Test if we can insert a guest trade post
    INSERT INTO trade_posts (
        id, 
        title, 
        owner_id, 
        guest_name, 
        is_authenticated, 
        status
    ) VALUES (
        gen_random_uuid()::text,
        'Test Guest Post',
        NULL,
        'Test Guest',
        false,
        'OPEN'
    );
    
    RAISE NOTICE 'Guest trade post insertion: SUCCESS';
    
    -- Clean up test data
    DELETE FROM trade_posts WHERE title = 'Test Guest Post';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Guest trade post insertion: FAILED - %', SQLERRM;
END $$;
