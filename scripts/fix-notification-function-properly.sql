-- 既存の関数を完全に置き換え
DROP FUNCTION IF EXISTS public.create_deck_comment_notification CASCADE;

-- 簡素化された通知関数（deck_pagesの場合は通知をスキップ）
CREATE OR REPLACE FUNCTION public.create_deck_comment_notification(
    p_deck_id UUID,
    p_commenter_user_id UUID,
    p_commenter_name TEXT
)
RETURNS VOID AS $$
BEGIN
    -- deck_pagesテーブルには所有者情報がないため、通知機能は無効
    -- 将来的にdeck_pagesに所有者情報が追加された場合に備えてログを出力
    RAISE NOTICE 'Comment notification skipped for deck_id: % (deck_pages table has no owner info)', p_deck_id;
    RETURN;
    
EXCEPTION
    WHEN OTHERS THEN
        -- エラーが発生してもコメント投稿は継続
        RAISE NOTICE 'Error in notification function: %', SQLERRM;
        RETURN;
END;
$$ LANGUAGE plpgsql;
