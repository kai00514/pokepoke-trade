"use client"

import { useState, useEffect } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/auth-context"

interface Notification {
  id: string
  type: string
  message: string
  created_at: string
  read: boolean
}

export default function NotificationDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const { user } = useAuth()
  const supabase = createClient()

  useEffect(() => {
    if (!user) return

    const fetchNotifications = async () => {
      try {
        // 自分の通知のみ取得（RLSにより制限される）
        const { data, error } = await supabase
          .from("deck_notifications")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10)

        if (error) {
          console.error("Error fetching notifications:", error)
          return
        }

        if (data) {
          setNotifications(data)
          setUnreadCount(data.filter((n) => !n.read).length)
        }
      } catch (error) {
        console.error("Unexpected error fetching notifications:", error)
      }
    }

    fetchNotifications()

    // リアルタイム通知の購読
    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "deck_notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification
          setNotifications((prev) => [newNotification, ...prev.slice(0, 9)])
          setUnreadCount((prev) => prev + 1)
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, supabase])

  const markAsRead = async (notificationId: string) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from("deck_notifications")
        .update({ read: true })
        .eq("id", notificationId)
        .eq("user_id", user.id) // 自分の通知のみ更新可能

      if (!error) {
        setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)))
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative bg-white text-violet-600 hover:bg-violet-100 rounded-full h-9 w-9 sm:h-10 sm:w-10"
          aria-label="通知を開く"
        >
          <Bell className="h-5 w-5 sm:h-6 sm:w-6" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
          <span className="sr-only">通知</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="p-4">
          <h3 className="font-semibold text-lg mb-2">通知</h3>
          {notifications.length === 0 ? (
            <p className="text-gray-500 text-sm">新しい通知はありません</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    notification.read ? "bg-gray-50 border-gray-200" : "bg-blue-50 border-blue-200"
                  }`}
                  onClick={() => !notification.read && markAsRead(notification.id)}
                >
                  <p className="text-sm font-medium">{notification.message}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(notification.created_at).toLocaleString("ja-JP")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
