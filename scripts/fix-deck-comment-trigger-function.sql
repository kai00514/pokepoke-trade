-- トリガー関数を修正（エラーハンドリングを追加）
CREATE OR REPLACE FUNCTION public.trigger_deck_comment_notification()
RETURNS TRIGGER AS $$
BEGIN
    -- ユーザーIDが存在する場合のみ通知を作成
    IF NEW.user_id IS NOT NULL THEN
        BEGIN
            PERFORM create_deck_comment_notification(
                NEW.deck_id,
                NEW.user_id::UUID,
                NEW.user_name
            );
        EXCEPTION
            WHEN OTHERS THEN
                -- 通知作成でエラーが発生してもコメント投稿は継続
                RAISE NOTICE 'Notification creation failed for comment %, error: %', NEW.id, SQLERRM;
        END;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
