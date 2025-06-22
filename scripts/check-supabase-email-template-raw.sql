-- SupabaseのEmail Templatesの生データを直接確認するクエリ
-- これはSupabaseの内部テーブルにアクセスするため、権限が必要な場合があります。
-- 通常のユーザーでは実行できない可能性が高いですが、問題の切り分けに役立ちます。
SELECT 
    id, 
    template_name, 
    subject, 
    html_body, 
    created_at, 
    updated_at
FROM auth.email_templates
WHERE template_name = 'recovery'; -- パスワードリセットのテンプレート名

-- 注意: このクエリはSupabaseの内部テーブルに直接アクセスするため、
-- 実行できない場合があります。その場合は、Supabaseのサポートに問い合わせる際に
-- この情報が必要であることを伝えてください。
