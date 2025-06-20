-- 1. 現在存在するRPC関数を確認
SELECT 
    routine_name,
    routine_type,
    data_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%deck%'
ORDER BY routine_name;

-- 2. 関数のパラメータを確認
SELECT 
    r.routine_name,
    p.parameter_name,
    p.data_type,
    p.parameter_mode
FROM information_schema.routines r
JOIN information_schema.parameters p ON r.specific_name = p.specific_name
WHERE r.routine_schema = 'public' 
AND r.routine_name LIKE '%deck%'
ORDER BY r.routine_name, p.ordinal_position;

-- 3. decksテーブルの構造を確認
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'decks' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. 簡単なテスト関数を作成
CREATE OR REPLACE FUNCTION public.test_function()
RETURNS text
LANGUAGE sql
AS $$
    SELECT 'Test function works!';
$$;

-- 5. パラメータ付きのテスト関数を作成
CREATE OR REPLACE FUNCTION public.test_with_param(test_input text)
RETURNS text
LANGUAGE sql
AS $$
    SELECT 'Received: ' || test_input;
$$;
