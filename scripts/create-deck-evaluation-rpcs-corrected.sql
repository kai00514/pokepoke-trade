-- デッキ評価を更新するRPC関数
CREATE OR REPLACE FUNCTION update_deck_evaluation(
  p_deck_page_id UUID,
  p_user_id UUID,
  p_score INTEGER
) RETURNS JSON AS $$
DECLARE
  v_new_eval_value DECIMAL(3,2);
  v_new_eval_count INTEGER;
BEGIN
  -- スコアの範囲チェック
  IF p_score < 1 OR p_score > 10 THEN
    RAISE EXCEPTION 'Score must be between 1 and 10';
  END IF;

  -- 評価をupsert（存在すれば更新、なければ挿入）
  INSERT INTO deck_evaluations (deck_page_id, user_id, score)
  VALUES (p_deck_page_id, p_user_id, p_score)
  ON CONFLICT (deck_page_id, user_id)
  DO UPDATE SET 
    score = EXCLUDED.score,
    updated_at = NOW();

  -- 平均値と件数を計算
  SELECT 
    ROUND(AVG(score)::DECIMAL, 2),
    COUNT(*)
  INTO v_new_eval_value, v_new_eval_count
  FROM deck_evaluations
  WHERE deck_page_id = p_deck_page_id;

  -- deck_pagesテーブルを更新
  UPDATE deck_pages
  SET 
    eval_value = v_new_eval_value,
    eval_count = v_new_eval_count
  WHERE id = p_deck_page_id;

  -- 結果を返す
  RETURN json_build_object(
    'success', true,
    'newEvalValue', v_new_eval_value,
    'newEvalCount', v_new_eval_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ユーザーが既に評価したかチェックするRPC関数
CREATE OR REPLACE FUNCTION has_user_evaluated_deck(
  p_deck_page_id UUID,
  p_user_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM deck_evaluations 
    WHERE deck_page_id = p_deck_page_id AND user_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
