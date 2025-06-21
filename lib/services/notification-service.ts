import { createClient } from "@supabase/supabase-js"
import type { Notification } from "@/types/notification"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// クライアントサイド用のSupabaseクライアント
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function getNotifications(userId: string): Promise<{
  success: boolean
  notifications?: Notification[]
  error?: string
}> {
  try {
    console.log("📡 Fetching notifications for user:", userId)

    // トレード通知を取得
    const { data: tradeNotifications, error: tradeError } = await supabase
      .from("trade_notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (tradeError) {
      console.error("❌ Error fetching trade notifications:", tradeError)
      return { success: false, error: tradeError.message }
    }

    // デッキ通知を取得
    const { data: deckNotifications, error: deckError } = await supabase
      .from("deck_notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (deckError) {
      console.error("❌ Error fetching deck notifications:", deckError)
      return { success: false, error: deckError.message }
    }

    // 通知を統合し、作成日時でソート
    const allNotifications: Notification[] = [
      ...(tradeNotifications || []).map((n) => ({ ...n, source: "trade" as const })),
      ...(deckNotifications || []).map((n) => ({ ...n, source: "deck" as const })),
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    console.log("✅ Notifications fetched successfully:", {
      trade: tradeNotifications?.length || 0,
      deck: deckNotifications?.length || 0,
      total: allNotifications.length,
      unread: allNotifications.filter((n) => !n.is_read).length,
    })

    return { success: true, notifications: allNotifications }
  } catch (error) {
    console.error("❌ Unexpected error fetching notifications:", error)
    return { success: false, error: "通知の取得に失敗しました" }
  }
}

export async function markNotificationAsRead(
  notificationId: string,
  source: "trade" | "deck",
): Promise<{ success: boolean; error?: string }> {
  try {
    const tableName = source === "trade" ? "trade_notifications" : "deck_notifications"

    console.log("📝 Marking notification as read:", { notificationId, source, tableName })

    const { error } = await supabase.from(tableName).update({ is_read: true }).eq("id", notificationId)

    if (error) {
      console.error("❌ Error marking notification as read:", error)
      return { success: false, error: error.message }
    }

    console.log("✅ Notification marked as read successfully")
    return { success: true }
  } catch (error) {
    console.error("❌ Unexpected error marking notification as read:", error)
    return { success: false, error: "通知の更新に失敗しました" }
  }
}

export async function markAllNotificationsAsRead(userId: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    console.log("📝 Marking all notifications as read for user:", userId)

    // トレード通知を既読にする
    const { error: tradeError } = await supabase
      .from("trade_notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false)

    if (tradeError) {
      console.error("❌ Error marking trade notifications as read:", tradeError)
      return { success: false, error: tradeError.message }
    }

    // デッキ通知を既読にする
    const { error: deckError } = await supabase
      .from("deck_notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false)

    if (deckError) {
      console.error("❌ Error marking deck notifications as read:", deckError)
      return { success: false, error: deckError.message }
    }

    console.log("✅ All notifications marked as read successfully")
    return { success: true }
  } catch (error) {
    console.error("❌ Unexpected error marking all notifications as read:", error)
    return { success: false, error: "通知の一括更新に失敗しました" }
  }
}

export function subscribeToNotifications(userId: string, onNotification: (notification: Notification) => void) {
  console.log("🔔 Setting up real-time notification subscription for user:", userId)

  // トレード通知の購読
  const tradeSubscription = supabase
    .channel("trade_notifications")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "trade_notifications",
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        console.log("🆕 New trade notification received:", payload.new)
        const notification: Notification = {
          ...payload.new,
          source: "trade",
        } as Notification
        onNotification(notification)
      },
    )
    .subscribe()

  // デッキ通知の購読
  const deckSubscription = supabase
    .channel("deck_notifications")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "deck_notifications",
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        console.log("🆕 New deck notification received:", payload.new)
        const notification: Notification = {
          ...payload.new,
          source: "deck",
        } as Notification
        onNotification(notification)
      },
    )
    .subscribe()

  console.log("✅ Real-time subscriptions established")

  // クリーンアップ関数を返す
  return () => {
    console.log("🧹 Cleaning up notification subscriptions")
    tradeSubscription.unsubscribe()
    deckSubscription.unsubscribe()
  }
}
