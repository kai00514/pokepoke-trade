-- 既存の外部キー制約を削除します。
-- 制約名は環境によって異なる可能性があるため、以下のクエリで正しい制約名を確認してください。
-- SELECT constraint_name FROM information_schema.table_constraints WHERE table_name = 'deck_comments' AND constraint_type = 'FOREIGN KEY';
-- 例: ALTER TABLE public.deck_comments DROP CONSTRAINT IF EXISTS deck_comments_deck_id_fkey;

-- 一般的な制約名を仮定して削除を試みます。
ALTER TABLE public.deck_comments DROP CONSTRAINT IF EXISTS deck_comments_deck_id_fkey;

-- もし上記でエラーが出る場合、以下のククエリで正しい制約名を確認し、手動で実行してください。
-- SELECT constraint_name FROM information_schema.table_constraints WHERE table_name = 'deck_comments' AND constraint_type = 'FOREIGN KEY';
