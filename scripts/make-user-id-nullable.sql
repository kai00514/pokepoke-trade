-- user_idをnullableに変更
ALTER TABLE public.deck_comments 
ALTER COLUMN user_id DROP NOT NULL;

-- 外部キー制約を削除して再作成（nullableに対応）
ALTER TABLE public.deck_comments 
DROP CONSTRAINT IF EXISTS deck_comments_user_id_fkey;

ALTER TABLE public.deck_comments 
ADD CONSTRAINT deck_comments_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE;
