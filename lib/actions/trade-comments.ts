import { createServerClient } from "@/lib/supabase/server"
import { v4 as uuidv4 } from "uuid"

export interface AddCommentInput {
  postId: string
  content: string
  parentId?: string
  userId?: string
  userName?: string
  isGuest?: boolean
  guestId?: string
}

export async function addComment(input: AddCommentInput) {
  const supabase = await createServerClient()
  const id = uuidv4()
  const now = new Date().toISOString()
  const { error } = await supabase.from("trade_comments").insert({
    id,
    post_id: input.postId,
    user_id: input.userId || input.guestId || "guest",
    content: input.content,
    parent_id: input.parentId || null,
    is_guest: input.isGuest || false,
    guest_id: input.guestId || null,
    created_at: now,
    updated_at: now,
    user_name: input.userName || null,
    is_deleted: false,
    is_edited: false,
    is_hidden: false,
  })
  if (error) return { success: false, error: error.message }
  return { success: true, id }
}

export async function getComments(postId: string) {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from("trade_comments")
    .select("*")
    .eq("post_id", postId)
    .order("created_at", { ascending: true })
  if (error) return { success: false, error: error.message, comments: [] }
  return { success: true, comments: data }
}

export async function deleteComment(commentId: string, userId: string) {
  const supabase = await createServerClient()
  const { error } = await supabase
    .from("trade_comments")
    .update({ is_deleted: true, content: "削除されました" })
    .eq("id", commentId)
    .eq("user_id", userId)
  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function editComment(commentId: string, userId: string, newContent: string) {
  const supabase = await createServerClient()
  const now = new Date().toISOString()
  const { error } = await supabase
    .from("trade_comments")
    .update({ content: newContent, is_edited: true, edited_at: now, updated_at: now })
    .eq("id", commentId)
    .eq("user_id", userId)
  if (error) return { success: false, error: error.message }
  return { success: true }
} 