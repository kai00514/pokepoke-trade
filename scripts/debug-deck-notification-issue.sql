-- まず、現在のデッキコメントとデッキの状況を確認
SELECT 
  'Recent deck comments' as info,
  dc.id,
  dc.deck_id,
  dc.user_id,
  dc.user_name,
  dc.comment_type,
  dc.content,
  dc.created_at
FROM deck_comments dc
ORDER BY dc.created_at DESC
LIMIT 5;

-- デッキの所有者情報を確認
SELECT 
  'Deck owners' as info,
  d.id as deck_id,
  d.user_id as owner_id,
  d.title,
  d.created_at
FROM decks d
ORDER BY d.created_at DESC
LIMIT 5;

-- deck_pages の情報を確認
SELECT 
  'Deck pages' as info,
  dp.id as deck_page_id,
  dp.deck_name,
  dp.created_at
FROM deck_pages dp
ORDER BY dp.created_at DESC
LIMIT 5;

-- 最近の通知を確認
SELECT 
  'Recent deck notifications' as info,
  dn.id,
  dn.user_id,
  dn.type,
  dn.content,
  dn.related_id,
  dn.created_at
FROM deck_notifications dn
ORDER BY dn.created_at DESC
LIMIT 5;

-- トリガーが存在するか確認
SELECT 
  'Triggers' as info,
  trigger_name,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name IN ('deck_comment_notification_trigger', 'trade_comment_notification_trigger');

-- 通知関数が存在するか確認
SELECT 
  'Functions' as info,
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines
WHERE routine_name IN ('create_deck_comment_notification', 'create_trade_comment_notification');
