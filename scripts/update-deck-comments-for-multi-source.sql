-- deck_comments テーブルにコメントタイプを識別するカラムを追加
ALTER TABLE deck_comments 
ADD COLUMN IF NOT EXISTS comment_type TEXT DEFAULT 'deck' CHECK (comment_type IN ('deck', 'deck_page'));

-- 既存の外部キー制約を削除（データ整合性はアプリケーションレベルで管理）
ALTER TABLE deck_comments 
DROP CONSTRAINT IF EXISTS deck_comments_deck_id_fkey;

-- 既存のデータに対してcomment_typeを設定（既存のコメントは'deck'タイプとして扱う）
UPDATE deck_comments 
SET comment_type = 'deck' 
WHERE comment_type IS NULL;

-- comment_typeをNOT NULLに変更
ALTER TABLE deck_comments 
ALTER COLUMN comment_type SET NOT NULL;

-- インデックスを追加してパフォーマンスを向上
CREATE INDEX IF NOT EXISTS idx_deck_comments_type_deck_id ON deck_comments(comment_type, deck_id);
