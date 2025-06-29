-- 既存の auth.users の内容を public.users に挿入するスクリプト
-- public.users に既に存在するユーザーはスキップされます。

INSERT INTO public.users (id, name, email, avatar_url, display_name)
SELECT
    au.id,
    au.raw_user_meta_data->>'full_name' AS name,
    au.email AS email,
    au.raw_user_meta_data->>'avatar_url' AS avatar_url,
    COALESCE(
        au.raw_user_meta_data->>'display_name',
        au.raw_user_meta_data->>'full_name',
        SPLIT_PART(au.email, '@', 1)
    ) AS display_name
FROM
    auth.users AS au
WHERE
    NOT EXISTS (
        SELECT 1
        FROM public.users AS pu
        WHERE pu.id = au.id
    );

COMMENT ON TABLE public.users IS 'アプリケーション固有のユーザープロファイル情報';
COMMENT ON COLUMN public.users.id IS 'auth.users テーブルのIDへの外部キー';
COMMENT ON COLUMN public.users.name IS 'ユーザーのフルネーム（プロバイダーから取得）';
COMMENT ON COLUMN public.users.email IS 'ユーザーのメールアドレス';
COMMENT ON COLUMN public.users.avatar_url IS 'ユーザーのアバター画像のURL';
COMMENT ON COLUMN public.users.display_name IS 'ユーザーの表示名（優先順位：display_name > full_name > メールアドレスのローカルパート）';
