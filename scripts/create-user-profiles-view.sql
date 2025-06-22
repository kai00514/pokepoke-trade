-- auth.users テーブルから必要なユーザーデータを公開するビューを作成
CREATE OR REPLACE VIEW public.user_profiles_view AS
SELECT
    id,
    raw_user_meta_data,
    avatar_url
FROM
    auth.users;

-- このビューに対してauthenticatedロールにSELECT権限を付与
GRANT SELECT ON public.user_profiles_view TO authenticated;
