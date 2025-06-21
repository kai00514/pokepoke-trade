ALTER TABLE deck_favorites
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'posts';
