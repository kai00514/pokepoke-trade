-- auth.uid()を取得するためのRPC関数を作成
CREATE OR REPLACE FUNCTION get_current_auth_uid()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT auth.uid();
$$;

-- 関数の実行権限を設定
GRANT EXECUTE ON FUNCTION get_current_auth_uid() TO authenticated, anon;
