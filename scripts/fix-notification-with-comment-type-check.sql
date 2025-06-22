-- comment_typeに基づいて適切に分岐する通知関数
CREATE OR REPLACE FUNCTION public.create_deck_comment_notification(
    p_deck_id UUID,
    p_commenter_user_id UUID,
    p_commenter_name TEXT,
    p_comment_type TEXT DEFAULT 'deck'
)
RETURNS VOID AS $$
DECLARE
    deck_owner_id UUID;
    deck_name TEXT;
    commenters RECORD;
BEGIN
    -- comment_typeによる分岐
    IF p_comment_type = 'deck' THEN
        -- decks テーブルから所有者情報を取得
        SELECT user_id, title INTO deck_owner_id, deck_name
        FROM decks 
        WHERE id = p_deck_id;
        
        -- 投稿者に通知（自分のコメントは除く）
        IF deck_owner_id IS NOT NULL AND deck_owner_id != p_commenter_user_id THEN
            INSERT INTO deck_notifications (user_id, type, content, related_id)
            VALUES (
                deck_owner_id::TEXT,
                'deck_comment',
                p_commenter_name || 'さんがあなたのデッキ「' || deck_name || '」にコメントしました',
                p_deck_id
            );
        END IF;
        
        -- 同じデッキにコメントした他のユーザーに通知
        FOR commenters IN
            SELECT DISTINCT user_id, user_name
            FROM deck_comments 
            WHERE deck_id = p_deck_id 
              AND user_id IS NOT NULL 
              AND user_id != p_commenter_user_id 
              AND user_id != deck_owner_id
        LOOP
            INSERT INTO deck_notifications (user_id, type, content, related_id)
            VALUES (
                commenters.user_id::TEXT,
                'deck_comment_reply',
                p_commenter_name || 'さんがデッキ「' || deck_name || '」にコメントしました',
                p_deck_id
            );
        END LOOP;
        
    ELSIF p_comment_type = 'deck_page' THEN
        -- deck_pagesは管理者コンテンツのため通知不要
        RAISE NOTICE 'No notifications for deck_page comments (admin content)';
        RETURN;
    ELSE
        RAISE NOTICE 'Unknown comment_type: %', p_comment_type;
        RETURN;
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        -- エラーが発生してもコメント投稿は継続
        RAISE NOTICE 'Notification creation failed: %', SQLERRM;
        RETURN;
END;
$$ LANGUAGE plpgsql;

-- トリガー関数も修正してcomment_typeを渡す
CREATE OR REPLACE FUNCTION public.trigger_deck_comment_notification()
RETURNS TRIGGER AS $$
BEGIN
    -- ユーザーIDが存在する場合のみ通知を作成
    IF NEW.user_id IS NOT NULL THEN
        PERFORM create_deck_comment_notification(
            NEW.deck_id,
            NEW.user_id,
            NEW.user_name,
            NEW.comment_type  -- comment_typeを渡す
        );
    END IF;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- エラーが発生してもコメント投稿は継続
        RAISE NOTICE 'Trigger notification failed: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql;
