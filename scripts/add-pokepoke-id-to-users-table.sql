-- public.users テーブルに pokepoke_id 列を追加
-- 既に存在する場合はエラーにならないように IF NOT EXISTS を使用
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS pokepoke_id TEXT UNIQUE;

-- 必要に応じて、pokepoke_id にインデックスを追加して検索性能を向上
CREATE UNIQUE INDEX IF NOT EXISTS users_pokepoke_id_idx ON public.users (pokepoke_id);

COMMENT ON COLUMN public.users.pokepoke_id IS 'ユーザーのポケポケID';
