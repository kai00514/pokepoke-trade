-- ===== デバッグ用クエリ =====

-- 1. 全投稿の認証状態確認
SELECT 
    'Total Posts Analysis' as analysis_type,
    COUNT(*) as total_posts,
    COUNT(CASE WHEN is_authenticated = true THEN 1 END) as authenticated_posts,
    COUNT(CASE WHEN is_authenticated = false THEN 1 END) as guest_posts,
    COUNT(CASE WHEN is_authenticated IS NULL THEN 1 END) as null_auth_posts
FROM trade_posts;

-- 2. 認証済み投稿の詳細確認
SELECT 
    'Authenticated Posts Details' as analysis_type,
    COUNT(*) as total_auth_posts,
    COUNT(CASE WHEN owner_id IS NOT NULL THEN 1 END) as with_owner_id,
    COUNT(CASE WHEN owner_id IS NULL THEN 1 END) as without_owner_id,
    COUNT(CASE WHEN guest_name IS NOT NULL THEN 1 END) as with_guest_name,
    COUNT(CASE WHEN guest_name IS NULL THEN 1 END) as without_guest_name
FROM trade_posts 
WHERE is_authenticated = true;

-- 3. ゲスト投稿の詳細確認
SELECT 
    'Guest Posts Details' as analysis_type,
    COUNT(*) as total_guest_posts,
    COUNT(CASE WHEN owner_id IS NOT NULL THEN 1 END) as with_owner_id,
    COUNT(CASE WHEN owner_id IS NULL THEN 1 END) as without_owner_id,
    COUNT(CASE WHEN guest_name IS NOT NULL THEN 1 END) as with_guest_name,
    COUNT(CASE WHEN guest_name IS NULL THEN 1 END) as without_guest_name
FROM trade_posts 
WHERE is_authenticated = false;

-- 4. 問題のある投稿を特定
SELECT 
    'Problematic Posts' as analysis_type,
    id,
    title,
    owner_id,
    guest_name,
    is_authenticated,
    created_at,
    CASE 
        WHEN is_authenticated = true AND owner_id IS NULL THEN 'AUTH_WITHOUT_OWNER'
        WHEN is_authenticated = false AND guest_name IS NULL THEN 'GUEST_WITHOUT_NAME'
        WHEN is_authenticated = true AND guest_name IS NOT NULL THEN 'AUTH_WITH_GUEST_NAME'
        WHEN is_authenticated = false AND owner_id IS NOT NULL THEN 'GUEST_WITH_OWNER'
        WHEN is_authenticated IS NULL THEN 'NULL_AUTH_STATUS'
        ELSE 'UNKNOWN_ISSUE'
    END as issue_type
FROM trade_posts 
WHERE 
    (is_authenticated = true AND owner_id IS NULL) OR
    (is_authenticated = false AND guest_name IS NULL) OR
    (is_authenticated = true AND guest_name IS NOT NULL) OR
    (is_authenticated = false AND owner_id IS NOT NULL) OR
    (is_authenticated IS NULL)
ORDER BY created_at DESC;

-- 5. 最新の投稿詳細（デバッグ用）
SELECT 
    'Latest Posts for Debug' as analysis_type,
    id,
    title,
    owner_id,
    guest_name,
    is_authenticated,
    created_at,
    status
FROM trade_posts 
ORDER BY created_at DESC 
LIMIT 5;

-- ===== 修正用クエリ（必要に応じて実行） =====

-- 6. is_authenticatedがNULLの投稿を修正（ゲストとして扱う）
UPDATE trade_posts 
SET 
    is_authenticated = false,
    guest_name = COALESCE(guest_name, 'ゲスト')
WHERE is_authenticated IS NULL;

-- 7. 認証済みなのにowner_idがNULLの投稿を特定（手動確認が必要）
SELECT 
    'Posts needing manual review' as note,
    id,
    title,
    owner_id,
    guest_name,
    is_authenticated,
    created_at
FROM trade_posts 
WHERE is_authenticated = true AND owner_id IS NULL;

-- 8. ゲスト投稿なのにguest_nameがNULLの投稿を修正
UPDATE trade_posts 
SET guest_name = 'ゲスト'
WHERE is_authenticated = false AND guest_name IS NULL;

-- ===== 最終確認 =====

-- 9. 修正後の状態確認
SELECT 
    'Final Status Check' as check_type,
    COUNT(*) as total_posts,
    COUNT(CASE WHEN is_authenticated = true AND owner_id IS NOT NULL AND guest_name IS NULL THEN 1 END) as correct_auth_posts,
    COUNT(CASE WHEN is_authenticated = false AND owner_id IS NULL AND guest_name IS NOT NULL THEN 1 END) as correct_guest_posts,
    COUNT(CASE WHEN 
        NOT (
            (is_authenticated = true AND owner_id IS NOT NULL AND guest_name IS NULL) OR
            (is_authenticated = false AND owner_id IS NULL AND guest_name IS NOT NULL)
        ) THEN 1 END) as still_problematic_posts
FROM trade_posts;

-- 10. 関連テーブルの整合性確認
SELECT 
    'Related Tables Check' as check_type,
    tp.id as post_id,
    tp.title,
    tp.is_authenticated,
    tp.owner_id,
    tp.guest_name,
    COUNT(wc.card_id) as wanted_cards_count,
    COUNT(oc.card_id) as offered_cards_count
FROM trade_posts tp
LEFT JOIN trade_post_wanted_cards wc ON tp.id = wc.post_id
LEFT JOIN trade_post_offered_cards oc ON tp.id = oc.post_id
GROUP BY tp.id, tp.title, tp.is_authenticated, tp.owner_id, tp.guest_name
ORDER BY tp.created_at DESC
LIMIT 10;
