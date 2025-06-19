import { createServerClient } from "@/lib/supabase/server"

export async function addDeckComment(
  deckId: string,
  content: string,
  userId?: string,
  userName?: string,
  isGuest?: boolean,
) {
  try {
    console.log("🗄️ [addDeckComment] Starting with params:", {
      deckId,
      content: content?.substring(0, 50) + "...",
      userId,
      userName,
      isGuest,
    })

    const supabase = await createServerClient()
    console.log("🗄️ [addDeckComment] Supabase client created successfully")

    // user_nameの適切な設定
    let finalUserName = "ゲスト"
    let finalUserId = null

    if (isGuest || !userId) {
      // ゲストユーザーの場合
      finalUserName = "ゲスト"
      finalUserId = null
      console.log("🗄️ [addDeckComment] Guest user detected")
    } else {
      // 認証済みユーザーの場合
      finalUserName = userName && userName.trim() ? userName.trim() : "匿名ユーザー"
      finalUserId = userId
      console.log("🗄️ [addDeckComment] Authenticated user detected")
    }

    console.log("🗄️ [addDeckComment] Final user info determined:", {
      finalUserName,
      finalUserId,
      isGuest: isGuest || !userId,
    })

    const insertData = {
      deck_id: deckId,
      content: content.trim(),
      user_id: finalUserId,
      user_name: finalUserName,
    }

    console.log("🗄️ [addDeckComment] Insert data prepared:", {
      deck_id: insertData.deck_id,
      content: insertData.content.substring(0, 50) + "...",
      user_id: insertData.user_id,
      user_name: insertData.user_name,
    })

    const { data, error } = await supabase.from("deck_comments").insert(insertData).select().single()

    if (error) {
      console.error("❌ [addDeckComment] Database error:", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      })
      return { success: false, error: `データベースエラー: ${error.message}` }
    }

    console.log("✅ [addDeckComment] Comment added successfully:", {
      id: data.id,
      deck_id: data.deck_id,
      user_id: data.user_id,
      user_name: data.user_name,
      content_length: data.content?.length,
    })

    // コメント数 (comment_count) をインクリメント
    const { error: countError } = await supabase.rpc("increment_deck_comments_count", {
      deck_id_input: deckId,
    })

    if (countError) {
      console.error("❌ [addDeckComment] Failed to increment comment count:", countError)
      // コメント自体は成功しているので、エラーを返さずにログに記録する
    } else {
      console.log("✅ [addDeckComment] Comment count incremented successfully for deck:", deckId)
    }

    return { success: true, comment: data }
  } catch (error) {
    console.error("❌ [addDeckComment] Unexpected error:", error)
    return { success: false, error: "予期しないエラーが発生しました" }
  }
}

export async function getDeckComments(deckId: string) {
  try {
    console.log("🗄️ [getDeckComments] Starting with deckId:", deckId)

    const supabase = await createServerClient()

    const { data, error } = await supabase
      .from("deck_comments")
      .select("*")
      .eq("deck_id", deckId)
      .is("parent_id", null)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("❌ [getDeckComments] Database error:", {
        code: error.code,
        message: error.message,
        details: error.details,
      })
      return { success: false, error: error.message, comments: [] }
    }

    console.log("✅ [getDeckComments] Comments fetched successfully:", {
      count: data?.length || 0,
      sample: data?.slice(0, 2).map((comment) => ({
        id: comment.id,
        user_id: comment.user_id,
        user_name: comment.user_name,
        content_preview: comment.content?.substring(0, 30) + "...",
      })),
    })

    return { success: true, comments: data || [] }
  } catch (error) {
    console.error("❌ [getDeckComments] Unexpected error:", error)
    return { success: false, error: "予期しないエラーが発生しました", comments: [] }
  }
}
