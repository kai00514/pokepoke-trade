-- deck_commentsテーブルにuser_nameカラムを追加
ALTER TABLE public.deck_comments 
ADD COLUMN user_name VARCHAR(255);
