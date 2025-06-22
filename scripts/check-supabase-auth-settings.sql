-- Supabase Auth設定の確認
-- このクエリでAuth設定を確認できます

-- 1. 現在のAuth設定を確認
SELECT 
  'Auth Settings Check' as info,
  current_setting('app.settings.auth.site_url', true) as site_url,
  current_setting('app.settings.auth.additional_redirect_urls', true) as additional_redirect_urls;

-- 2. 最近のAuth関連のログを確認（もしあれば）
-- SELECT * FROM auth.audit_log_entries 
-- WHERE created_at > NOW() - INTERVAL '1 hour'
-- ORDER BY created_at DESC
-- LIMIT 10;

-- 注意: 
-- Supabaseの管理画面で以下を確認してください:
-- 1. Authentication > Settings > Site URL
-- 2. Authentication > Settings > Redirect URLs
-- 
-- 以下のURLが追加されている必要があります:
-- - http://localhost:3000/auth/reset (開発環境)
-- - https://your-domain.com/auth/reset (本番環境)
