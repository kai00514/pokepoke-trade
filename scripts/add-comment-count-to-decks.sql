-- decks テーブルに comment_count カラムが存在するかチェック
DO $$
BEGIN
    -- comment_count カラムが存在しない場合は追加
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'decks' 
        AND column_name = 'comment_count'
    ) THEN
        ALTER TABLE decks ADD COLUMN comment_count INTEGER DEFAULT 0;
        RAISE NOTICE 'Added comment_count column to decks table';
    ELSE
        RAISE NOTICE 'comment_count column already exists in decks table';
    END IF;
END $$;

-- 既存のコメント数を集計して更新
UPDATE decks 
SET comment_count = (
    SELECT COUNT(*) 
    FROM deck_comments 
    WHERE deck_comments.deck_id = decks.id 
    AND deck_comments.comment_type = 'deck'
)
WHERE EXISTS (
    SELECT 1 
    FROM deck_comments 
    WHERE deck_comments.deck_id = decks.id 
    AND deck_comments.comment_type = 'deck'
);

-- 結果を確認
SELECT id, title, comment_count 
FROM decks 
WHERE comment_count > 0 
LIMIT 10;
