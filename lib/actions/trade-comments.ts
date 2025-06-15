import { createServerClient } from "@/lib/supabase/server"

export async function addComment(
  postId: string,
  content: string,
  userId?: string,
  userName?: string,
  isGuest?: boolean,
  guestId?: string,
) {
  try {
    const supabase = await createServerClient()

    // ログインユーザーの場合はuser_idを設定、ゲストの場合はnull
    const insertData = {
      post_id: postId,
      content: content.trim(),
      user_id: isGuest ? null : userId, // 認証済みユーザーのIDを設定
      user_name: userName || (isGuest ? "ゲスト" : "匿名ユーザー"),
      guest_name: isGuest ? userName || "ゲスト" : null,
      is_guest: !!isGuest,
      is_deleted: false,
      is_edited: false,
    }

    console.log("[addComment] Insert data:", insertData)

    const { data, error } = await supabase.from("trade_comments").insert(insertData).select().single()

    if (error) {
      console.error("Error adding comment:", error)
      return { success: false, error: error.message }
    }

    console.log("[addComment] Comment added successfully:", data)
    return { success: true, comment: data }
  } catch (error) {
    console.error("Unexpected error adding comment:", error)
    return { success: false, error: "予期しないエラーが発生しました" }
  }
}

export async function getComments(postId: string) {
  try {
    const supabase = await createServerClient()

    const { data, error } = await supabase
      .from("trade_comments")
      .select("*")
      .eq("post_id", postId)
      .eq("is_deleted", false)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Error fetching comments:", error)
      return { success: false, error: error.message, comments: [] }
    }

    return { success: true, comments: data || [] }
  } catch (error) {
    console.error("Unexpected error fetching comments:", error)
    return { success: false, error: "予期しないエラーが発生しました", comments: [] }
  }
}
