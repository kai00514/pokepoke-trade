-- テーブルの列情報を取得するRPC関数を作成
CREATE OR REPLACE FUNCTION get_table_columns(table_name text)
RETURNS TABLE(
  column_name text,
  data_type text,
  is_nullable text,
  column_default text
) 
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    c.column_name::text,
    c.data_type::text,
    c.is_nullable::text,
    c.column_default::text
  FROM 
    information_schema.columns c
  WHERE 
    c.table_name = $1 
    AND c.table_schema = 'public'
  ORDER BY 
    c.ordinal_position;
$$;
