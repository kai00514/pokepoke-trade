import { createServerClient } from "@/lib/supabase/server"

export async function addDeckComment(
  deckId: string,
  content: string,
  userId?: string,
  userName?: string,
  isGuest?: boolean,
  commentType: "deck" | "deck_page" = "deck",
) {
  try {
    console.log("🗄️ [addDeckComment] Starting with params:", {
      deckId,
      content: content?.substring(0, 50) + "...",
      userId,
      userName,
      isGuest,
      commentType,
      userIdType: typeof userId,
      userIdLength: userId?.length,
    })

    const supabase = await createServerClient()
    console.log("🗄️ [addDeckComment] Supabase client created successfully")

    // user_nameの適切な設定
    let finalUserName = "ゲスト"
    let finalUserId = null

    if (isGuest || !userId) {
      finalUserName = "ゲスト"
      finalUserId = null
      console.log("🗄️ [addDeckComment] Guest user detected")
    } else {
      // 認証済みユーザーの場合
      finalUserName = userName && userName.trim() && userName !== "undefined" ? userName.trim() : "匿名ユーザー"

      // userIdがUUID形式かどうかを確認
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      if (uuidRegex.test(userId)) {
        finalUserId = userId
        console.log("🗄️ [addDeckComment] Valid UUID user ID detected")
      } else {
        console.log("🗄️ [addDeckComment] Invalid UUID format for user_id:", userId)
        // UUID形式でない場合はゲストとして扱う
        finalUserName = userName && userName.trim() ? userName.trim() + " (外部認証)" : "外部認証ユーザー"
        finalUserId = null
      }
    }

    console.log("🗄️ [addDeckComment] Final user info determined:", {
      finalUserName,
      finalUserId,
      isGuest: isGuest || !finalUserId,
      commentType,
      originalUserName: userName,
      originalUserId: userId,
    })

    // コメントタイプに基づいてデッキの存在確認
    const validationResult = await validateDeckExists(supabase, deckId, commentType)
    if (!validationResult.exists) {
      console.error("❌ [addDeckComment] Deck validation failed:", {
        deckId,
        commentType,
        error: validationResult.error,
      })
      return { success: false, error: `指定されたデッキが見つかりません: ${validationResult.error}` }
    }

    const insertData = {
      deck_id: deckId,
      content: content.trim(),
      user_id: finalUserId, // nullまたは有効なUUID
      user_name: finalUserName,
      comment_type: commentType,
    }

    console.log("🗄️ [addDeckComment] Insert data prepared:", {
      deck_id: insertData.deck_id,
      content: insertData.content.substring(0, 50) + "...",
      user_id: insertData.user_id,
      user_name: insertData.user_name,
      comment_type: insertData.comment_type,
    })

    const { data, error } = await supabase.from("deck_comments").insert(insertData).select().single()

    if (error) {
      console.error("❌ [addDeckComment] Database error:", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        insertData: insertData,
      })
      return { success: false, error: `データベースエラー: ${error.message}` }
    }

    console.log("✅ [addDeckComment] Comment added successfully:", {
      id: data.id,
      deck_id: data.deck_id,
      user_id: data.user_id,
      user_name: data.user_name,
      comment_type: data.comment_type,
      content_length: data.content?.length,
    })

    return { success: true, comment: data }
  } catch (error) {
    console.error("❌ [addDeckComment] Unexpected error:", error)
    return { success: false, error: "予期しないエラーが発生しました" }
  }
}

// デッキの存在確認関数
async function validateDeckExists(supabase: any, deckId: string, commentType: "deck" | "deck_page") {
  try {
    if (commentType === "deck") {
      console.log("🔍 [validateDeckExists] Checking decks table for ID:", deckId)
      const { data, error } = await supabase.from("decks").select("id").eq("id", deckId).single()

      if (error || !data) {
        console.log("❌ [validateDeckExists] decks validation failed:", { deckId, error })
        return { exists: false, error: `decks テーブルにID ${deckId} が見つかりません` }
      }
      console.log("✅ [validateDeckExists] decks validation successful:", deckId)
    } else if (commentType === "deck_page") {
      console.log("🔍 [validateDeckExists] Checking deck_pages table for ID:", deckId)
      const { data, error } = await supabase.from("deck_pages").select("id").eq("id", deckId).single()

      if (error || !data) {
        console.log("❌ [validateDeckExists] deck_pages validation failed:", { deckId, error })
        return { exists: false, error: `deck_pages テーブルにID ${deckId} が見つかりません` }
      }
      console.log("✅ [validateDeckExists] deck_pages validation successful:", deckId)
    }

    return { exists: true }
  } catch (error) {
    console.error("❌ [validateDeckExists] Validation error:", error)
    return { exists: false, error: `検証エラー: ${error}` }
  }
}

export async function getDeckComments(deckId: string, commentType?: "deck" | "deck_page") {
  try {
    console.log("🗄️ [getDeckComments] Starting with deckId:", deckId, "commentType:", commentType)

    const supabase = await createServerClient()

    let query = supabase
      .from("deck_comments")
      .select("*")
      .eq("deck_id", deckId)
      .is("parent_id", null)
      .order("created_at", { ascending: true })

    // コメントタイプが指定されている場合はフィルタリング
    if (commentType) {
      query = query.eq("comment_type", commentType)
    }

    const { data, error } = await query

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
      commentType,
      sample: data?.slice(0, 2).map((comment) => ({
        id: comment.id,
        user_id: comment.user_id,
        user_name: comment.user_name,
        comment_type: comment.comment_type,
        content_preview: comment.content?.substring(0, 30) + "...",
      })),
    })

    return { success: true, comments: data || [] }
  } catch (error) {
    console.error("❌ [getDeckComments] Unexpected error:", error)
    return { success: false, error: "予期しないエラーが発生しました", comments: [] }
  }
}
