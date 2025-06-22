-- auth.users テーブルに user_name カラムを追加
-- このカラムは TEXT 型で、NULL を許容します。
ALTER TABLE auth.users
ADD COLUMN IF NOT EXISTS user_name TEXT;

-- 必要に応じて、既存のユーザーの user_name を raw_user_meta_data から設定する
-- 例: display_name が存在する場合
UPDATE auth.users
SET user_name = raw_user_meta_data->>'display_name'
WHERE raw_user_meta_data->>'display_name' IS NOT NULL
  AND user_name IS NULL;

-- または full_name が存在する場合
UPDATE auth.users
SET user_name = raw_user_meta_data->>'full_name'
WHERE raw_user_meta_data->>'full_name' IS NOT NULL
  AND user_name IS NULL;
