-- p_deck_page_id が INTEGER 型の update_deck_evaluation 関数を削除します。
-- この関数が存在しない場合はエラーになりません。
DROP FUNCTION IF EXISTS update_deck_evaluation(integer, uuid, integer);
