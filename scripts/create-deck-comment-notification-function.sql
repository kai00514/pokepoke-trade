-- 既存の関数を削除し、新しい定義で再作成します。
DROP FUNCTION IF EXISTS public.create_deck_comment_notification CASCADE;

CREATE OR REPLACE FUNCTION public.create_deck_comment_notification(
    p_deck_id UUID,
    p_commenter_user_id TEXT, -- user_idがTEXT型であることを考慮
    p_comment_content VARCHAR,
    p_comment_type TEXT -- comment_typeを追加
)
RETURNS VOID AS $$
DECLARE
    v_deck_owner_id UUID;
    v_notification_type TEXT;
    v_related_id UUID;
BEGIN
    -- コメントタイプに応じてデッキの所有者IDと関連IDを取得
    IF p_comment_type = 'deck' THEN
        SELECT user_id INTO v_deck_owner_id FROM public.decks WHERE id = p_deck_id;
        v_related_id := p_deck_id;
        v_notification_type := 'deck_comment';
    ELSIF p_comment_type = 'deck_page' THEN
        -- deck_pagesにはuser_idがないため、通知は作成しないか、別のロジックを検討
        -- ここでは、deck_pagesのコメントに対する通知は作成しないと仮定します。
        -- もしdeck_pagesのコメントに対する通知が必要な場合は、
        -- deck_pagesの作成者IDなどを取得するロジックを追加する必要があります。
        RAISE NOTICE 'Skipping notification for deck_page comment on deck_id %', p_deck_id;
        RETURN;
    ELSE
        RAISE EXCEPTION 'Unknown comment_type: %', p_comment_type;
    END IF;

    -- デッキの所有者がコメント投稿者と異なる場合にのみ通知を作成
    IF v_deck_owner_id IS NOT NULL AND v_deck_owner_id::TEXT != p_commenter_user_id THEN
        INSERT INTO public.deck_notifications (user_id, type, content, related_id)
        VALUES (
            v_deck_owner_id::TEXT, -- user_idがTEXT型なのでキャスト
            v_notification_type,
            'あなたのデッキに新しいコメントが投稿されました: ' || LEFT(p_comment_content, 50) || '...',
            v_related_id
        );
    END IF;
END;
$$ LANGUAGE plpgsql;
