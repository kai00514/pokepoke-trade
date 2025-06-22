-- デバッグ用のログ付き通知関数を実行
-- 先ほどのscripts/recreate-all-notification-system-perfect-final.sqlを実行してください

-- その後、以下のクエリでログを確認できます
-- Supabaseの場合、ログビューアで確認してください

-- 現在のデッキコメントの状況を確認
SELECT 
  dc.id,
  dc.deck_id,
  dc.user_id,
  dc.user_name,
  dc.comment_type,
  dc.content,
  dc.created_at,
  -- デッキ情報も取得
  CASE 
    WHEN dc.comment_type = 'deck' THEN (
      SELECT d.title FROM decks d WHERE d.id = dc.deck_id
    )
    WHEN dc.comment_type = 'deck_page' THEN (
      SELECT dp.deck_name FROM deck_pages dp WHERE dp.id = dc.deck_id
    )
  END as deck_title,
  CASE 
    WHEN dc.comment_type = 'deck' THEN (
      SELECT d.user_id FROM decks d WHERE d.id = dc.deck_id
    )
    ELSE NULL
  END as deck_owner_id
FROM deck_comments dc
ORDER BY dc.created_at DESC
LIMIT 10;

-- 通知テーブルの状況を確認
SELECT 
  'deck_notifications' as table_name,
  dn.id,
  dn.user_id,
  dn.type,
  dn.content,
  dn.related_id,
  dn.is_read,
  dn.created_at
FROM deck_notifications dn
ORDER BY dn.created_at DESC
LIMIT 10

UNION ALL

SELECT 
  'trade_notifications' as table_name,
  tn.id,
  tn.user_id,
  tn.type,
  tn.content,
  tn.related_id,
  tn.is_read,
  tn.created_at
FROM trade_notifications tn
ORDER BY tn.created_at DESC
LIMIT 10;
