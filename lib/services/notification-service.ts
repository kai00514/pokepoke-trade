import { createServerClient } from "@/lib/supabase/server"
import { createBrowserClient } from "@/lib/supabase/client"
import type { Notification } from "@/types/notification"

// サーバーサイドで通知を取得
export async function getNotifications(userId: string): Promise<{
  success: boolean
  notifications: Notification[]
  error?: string
}> {
  try {
    const supabase = await createServerClient()

    // トレード通知を取得
    const { data: tradeNotifications, error: tradeError } = await supabase
      .from("trade_notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (tradeError) {
      console.error("Error fetching trade notifications:", tradeError)
      return { success: false, notifications: [], error: tradeError.message }
    }

    // デッキ通知を取得
    const { data: deckNotifications, error: deckError } = await supabase
      .from("deck_notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (deckError) {
      console.error("Error fetching deck notifications:", deckError)
      return { success: false, notifications: [], error: deckError.message }
    }

    // 通知をマージして日時順にソート
    const allNotifications: Notification[] = [
      ...(tradeNotifications || []).map((n) => ({ ...n, category: "trade" as const })),
      ...(deckNotifications || []).map((n) => ({ ...n, category: "deck" as const })),
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return { success: true, notifications: allNotifications }
  } catch (error) {
    console.error("Unexpected error fetching notifications:", error)
    return { success: false, notifications: [], error: "予期しないエラーが発生しました" }
  }
}

// クライアントサイドで通知を既読にする
export async function markNotificationAsRead(
  notificationId: string,
  category: "trade" | "deck",
): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const supabase = createBrowserClient()
    const tableName = category === "trade" ? "trade_notifications" : "deck_notifications"

    const { error } = await supabase.from(tableName).update({ is_read: true }).eq("id", notificationId)

    if (error) {
      console.error("Error marking notification as read:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error("Unexpected error marking notification as read:", error)
    return { success: false, error: "予期しないエラーが発生しました" }
  }
}

// クライアントサイドで未読通知数を取得
export async function getUnreadNotificationCount(userId: string): Promise<{
  success: boolean
  count: number
  error?: string
}> {
  try {
    const supabase = createBrowserClient()

    // トレード通知の未読数
    const { count: tradeCount, error: tradeError } = await supabase
      .from("trade_notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_read", false)

    if (tradeError) {
      console.error("Error fetching unread trade notifications count:", tradeError)
      return { success: false, count: 0, error: tradeError.message }
    }

    // デッキ通知の未読数
    const { count: deckCount, error: deckError } = await supabase
      .from("deck_notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_read", false)

    if (deckError) {
      console.error("Error fetching unread deck notifications count:", deckError)
      return { success: false, count: 0, error: deckError.message }
    }

    const totalCount = (tradeCount || 0) + (deckCount || 0)
    return { success: true, count: totalCount }
  } catch (error) {
    console.error("Unexpected error fetching unread notification count:", error)
    return { success: false, count: 0, error: "予期しないエラーが発生しました" }
  }
}
