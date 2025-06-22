-- 既存の通知関数を完全に無効化
CREATE OR REPLACE FUNCTION public.create_deck_comment_notification(
    p_deck_id UUID,
    p_commenter_user_id UUID,
    p_commenter_name TEXT
)
RETURNS VOID AS $$
BEGIN
    -- deck_pagesは管理者コンテンツのため通知不要
    -- 何もせずに正常終了
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- トリガー関数も簡素化
CREATE OR REPLACE FUNCTION public.trigger_deck_comment_notification()
RETURNS TRIGGER AS $$
BEGIN
    -- deck_pagesコメントには通知機能不要のため何もしない
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
