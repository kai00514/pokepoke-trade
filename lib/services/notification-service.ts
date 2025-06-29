import { createBrowserClient } from "@/lib/supabase/client"

interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  message: string
  is_read: boolean
  created_at: string
  related_id?: string
}

interface NotificationResult {
  success: boolean
  notifications?: Notification[]
  error?: string
}

export async function getNotifications(userId: string): Promise<NotificationResult> {
  const supabase = createBrowserClient()

  try {
    const { data, error } = await supabase
      .from("deck_notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50)

    if (error) {
      console.error("Error fetching notifications:", error)
      return { success: false, error: error.message }
    }

    return { success: true, notifications: data || [] }
  } catch (error) {
    console.error("Error in getNotifications:", error)
    return { success: false, error: "Failed to fetch notifications" }
  }
}

export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
  const supabase = createBrowserClient()

  try {
    const { error } = await supabase.from("deck_notifications").update({ is_read: true }).eq("id", notificationId)

    if (error) {
      console.error("Error marking notification as read:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in markNotificationAsRead:", error)
    return false
  }
}

export async function markAllNotificationsAsRead(userId: string): Promise<boolean> {
  const supabase = createBrowserClient()

  try {
    const { error } = await supabase
      .from("deck_notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false)

    if (error) {
      console.error("Error marking all notifications as read:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in markAllNotificationsAsRead:", error)
    return false
  }
}
