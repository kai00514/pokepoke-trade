INSERT INTO public.trade_comments (
  id,
  post_id,  -- trade_id から post_id に修正
  content,
  user_id,
  user_name,
  is_guest,
  guest_id,
  created_at
) VALUES (
  gen_random_uuid(), -- 新しいUUIDを自動生成
  'fb760080-7ade-4094-b50a-3c002558a7ff',
  'これはテストコメントです。',
  'dba9dfdc-b861-4586-9671-ebb2adae2b90',
  'テストユーザー',
  FALSE, -- ゲストユーザーの場合はTRUE、それ以外はFALSE
  NULL,  -- ゲストユーザーでない場合はNULL
  NOW()  -- 現在のタイムスタンプ
);
