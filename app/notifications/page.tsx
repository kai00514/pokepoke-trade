"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { getNotifications } from "@/lib/services/notification-service"
import NotificationList from "@/components/notification-list"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bell, Loader2 } from "lucide-react"
import type { Notification } from "@/types/notification"

export default function NotificationsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (loading) return

    if (!user) {
      router.push("/auth/login")
      return
    }

    const fetchNotifications = async () => {
      try {
        setIsLoading(true)
        const result = await getNotifications(user.id)

        if (result.success && result.notifications) {
          setNotifications(result.notifications)
        } else {
          setError(result.error || "通知の取得に失敗しました")
        }
      } catch (err) {
        console.error("Error fetching notifications:", err)
        setError("通知の取得中にエラーが発生しました")
      } finally {
        setIsLoading(false)
      }
    }

    fetchNotifications()
  }, [user, loading, router])

  const handleNotificationRead = (notificationId: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n)))
  }

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>読み込み中...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-red-600">{error}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-6 w-6" />
              通知
            </CardTitle>
          </CardHeader>
          <CardContent>
            <NotificationList notifications={notifications} onNotificationRead={handleNotificationRead} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
