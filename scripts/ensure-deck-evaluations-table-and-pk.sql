DO $$
BEGIN
    -- deck_evaluations テーブルが存在しない場合は作成
    CREATE TABLE IF NOT EXISTS deck_evaluations (
        deck_page_id UUID NOT NULL,
        user_id UUID NOT NULL,
        score INTEGER NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- 複合主キーが存在しない場合のみ追加
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'deck_evaluations'::regclass
          AND contype = 'p'
          AND conname = 'deck_evaluations_pkey' -- 主キー名もチェック
    ) THEN
        ALTER TABLE deck_evaluations
        ADD CONSTRAINT deck_evaluations_pkey PRIMARY KEY (deck_page_id, user_id);
    END IF;

    -- 必要��応じてインデックスを追加 (パフォーマンスのため)
    CREATE INDEX IF NOT EXISTS idx_deck_evaluations_deck_page_id ON deck_evaluations (deck_page_id);
    CREATE INDEX IF NOT EXISTS idx_deck_evaluations_user_id ON deck_evaluations (user_id);

END
$$;
