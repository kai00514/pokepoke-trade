-- リアルタイム通知を有効化
-- trade_notifications テーブルでリアルタイム機能を有効化
ALTER PUBLICATION supabase_realtime ADD TABLE trade_notifications;

-- deck_notifications テーブルでリアルタイム機能を有効化
ALTER PUBLICATION supabase_realtime ADD TABLE deck_notifications;

-- 必要に応じて、リアルタイム機能が無効になっている場合は有効化
-- （通常はSupabaseダッシュボードで設定しますが、SQLでも可能です）
