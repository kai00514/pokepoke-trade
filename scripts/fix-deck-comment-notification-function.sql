-- 既存の関数を削除
DROP FUNCTION IF EXISTS public.create_deck_comment_notification CASCADE;

-- 修正された通知関数を作成
CREATE OR REPLACE FUNCTION public.create_deck_comment_notification(
    p_deck_id UUID,
    p_commenter_user_id UUID,
    p_commenter_name TEXT
)
RETURNS VOID AS $$
DECLARE
    v_deck_owner_id UUID;
    v_deck_name TEXT;
    v_comment_type TEXT;
BEGIN
    -- まず、コメントのタイプを特定（deck_commentsテーブルから取得）
    SELECT comment_type INTO v_comment_type
    FROM deck_comments 
    WHERE deck_id = p_deck_id 
        AND user_id = p_commenter_user_id
    ORDER BY created_at DESC 
    LIMIT 1;
    
    -- コメントタイプに応じて適切なテーブルから情報を取得
    IF v_comment_type = 'deck' THEN
        -- decksテーブルから所有者情報を取得
        SELECT user_id, deck_name INTO v_deck_owner_id, v_deck_name
        FROM decks 
        WHERE id = p_deck_id;
        
    ELSIF v_comment_type = 'deck_page' THEN
        -- deck_pagesテーブルから情報を取得（user_idカラムがないため、通知をスキップ）
        SELECT deck_name INTO v_deck_name
        FROM deck_pages 
        WHERE id = p_deck_id;
        
        -- deck_pagesには所有者情報がないため、通知は作成しない
        RAISE NOTICE 'Skipping notification for deck_page comment on deck_id %, no owner info available', p_deck_id;
        RETURN;
        
    ELSE
        -- 不明なコメントタイプの場合
        RAISE NOTICE 'Unknown comment_type: % for deck_id %', v_comment_type, p_deck_id;
        RETURN;
    END IF;
    
    -- デッキの所有者が存在し、コメント投稿者と異なる場合にのみ通知を作成
    IF v_deck_owner_id IS NOT NULL AND v_deck_owner_id != p_commenter_user_id THEN
        INSERT INTO deck_notifications (user_id, type, content, related_id)
        VALUES (
            v_deck_owner_id::TEXT, -- deck_notifications.user_idがTEXT型の場合
            'deck_comment',
            p_commenter_name || 'さんがあなたのデッキ「' || COALESCE(v_deck_name, 'Unknown') || '」にコメントしました',
            p_deck_id
        );
        
        RAISE NOTICE 'Notification created for deck owner % about comment from %', v_deck_owner_id, p_commenter_name;
    ELSE
        RAISE NOTICE 'No notification created: owner=%, commenter=%', v_deck_owner_id, p_commenter_user_id;
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        -- エラーが発生してもコメント投稿は継続させる
        RAISE NOTICE 'Error in create_deck_comment_notification: %', SQLERRM;
        RETURN;
END;
$$ LANGUAGE plpgsql;
