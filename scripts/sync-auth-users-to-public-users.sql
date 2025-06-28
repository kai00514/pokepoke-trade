-- 1. トリガー関数を作成
-- auth.users に新しい行が挿入されたときに public.users にデータをコピーする
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    _name TEXT;
    _email TEXT;
    _display_name TEXT;
    _avatar_url TEXT;
BEGIN
    -- auth.users の raw_user_meta_data から full_name を取得し、name 列に設定
    SELECT NEW.raw_user_meta_data->>'full_name' INTO _name;

    -- auth.users の email を取得し、email 列に設定
    _email := NEW.email;

    -- auth.users の raw_user_meta_data から display_name を取得し、display_name 列に設定
    -- display_name がない場合のフォールバックも考慮
    SELECT COALESCE(
        NEW.raw_user_meta_data->>'display_name',
        NEW.raw_user_meta_data->>'full_name', -- display_name がない場合は full_name を使用
        SPLIT_PART(NEW.email, '@', 1) -- それもなければメールアドレスの@より前を使用
    ) INTO _display_name;

    -- user_metadata から avatar_url を取得
    SELECT NEW.raw_user_meta_data->>'avatar_url' INTO _avatar_url;

    -- public.users テーブルにデータを挿入
    INSERT INTO public.users (id, name, email, avatar_url, display_name)
    VALUES (NEW.id, _name, _email, _avatar_url, _display_name);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. トリガーを作成
-- auth.users テーブルへの INSERT 操作後に handle_new_user 関数を実行
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
