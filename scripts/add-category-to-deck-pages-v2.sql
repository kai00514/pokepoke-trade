-- deck_pagesテーブルにcategoryカラムを追加
ALTER TABLE deck_pages
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'featured';

-- カテゴリのENUM型を作成（オプション）
DO $$ BEGIN
    CREATE TYPE deck_category AS ENUM ('tier', 'newpack', 'featured');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- categoryカラムの型をENUMに変更
ALTER TABLE deck_pages
ALTER COLUMN category TYPE deck_category USING category::deck_category
