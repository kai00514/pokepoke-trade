-- 1. deck_pagesテーブルにcategoryカラムを追加 (TEXT型で一時的に)
--    既に存在する場合は何もしない
ALTER TABLE deck_pages
ADD COLUMN IF NOT EXISTS category TEXT;

-- 2. カテゴリのENUM型を作成
DO $$ BEGIN
    CREATE TYPE deck_category AS ENUM ('tier', 'newpack', 'featured');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. 既存のcategoryカラムの値をENUMに合うように更新
--    NULL値やENUMにない値を'featured'に設定
UPDATE deck_pages
SET category = 'featured'
WHERE category IS NULL OR category NOT IN ('tier', 'newpack', 'featured');

-- 4. 既存のDEFAULT制約を削除 (もしあれば)
--    これは、型変更時の自動キャストエラーを避けるため
ALTER TABLE deck_pages
ALTER COLUMN category DROP DEFAULT;

-- 5. categoryカラムの型をENUMに変更
ALTER TABLE deck_pages
ALTER COLUMN category TYPE deck_category USING category::deck_category;

-- 6. 新しいDEFAULT制約をENUM型で追加
ALTER TABLE deck_pages
ALTER COLUMN category SET DEFAULT 'featured'::deck_category;

-- インデックスの追加 (パフォーマンス向上のため)
CREATE INDEX IF NOT EXISTS idx_deck_pages_category ON deck_pages (category);
