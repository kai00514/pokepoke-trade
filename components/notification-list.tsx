"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Bell, MessageCircle, FileText } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { markNotificationAsRead } from "@/lib/services/notification-service"
import type { Notification } from "@/types/notification"
import Link from "next/link"

interface NotificationListProps {
  notifications: Notification[]
  onNotificationRead?: (notificationId: string) => void
}

export default function NotificationList({ notifications, onNotificationRead }: NotificationListProps) {
  const { user } = useAuth()
  const [localNotifications, setLocalNotifications] = useState<Notification[]>(notifications)

  useEffect(() => {
    setLocalNotifications(notifications)
  }, [notifications])

  const handleMarkAsRead = async (notification: Notification) => {
    if (notification.is_read) return

    const result = await markNotificationAsRead(notification.id, notification.category)
    if (result.success) {
      setLocalNotifications((prev) => prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n)))
      onNotificationRead?.(notification.id)
    }
  }

  const getNotificationIcon = (type: string) => {
    if (type.includes("comment")) {
      return <MessageCircle className="h-4 w-4" />
    }
    return <FileText className="h-4 w-4" />
  }

  const getNotificationLink = (notification: Notification) => {
    if (notification.category === "trade") {
      return `/trades/${notification.related_id}`
    } else {
      return `/content/${notification.related_id}`
    }
  }

  if (!user) {
    return (
      <div className="text-center py-8">
        <Bell className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-600">ログインして通知を確認してください</p>
      </div>
    )
  }

  if (localNotifications.length === 0) {
    return (
      <div className="text-center py-8">
        <Bell className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-600">通知はありません</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {localNotifications.map((notification) => (
        <Card
          key={notification.id}
          className={`transition-all hover:shadow-md ${
            !notification.is_read ? "border-l-4 border-l-blue-500 bg-blue-50" : ""
          }`}
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div
                className={`p-2 rounded-full ${
                  notification.category === "trade" ? "bg-green-100 text-green-600" : "bg-purple-100 text-purple-600"
                }`}
              >
                {getNotificationIcon(notification.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge
                    variant={notification.category === "trade" ? "default" : "secondary"}
                    className={
                      notification.category === "trade"
                        ? "bg-green-100 text-green-800 hover:bg-green-200"
                        : "bg-purple-100 text-purple-800 hover:bg-purple-200"
                    }
                  >
                    {notification.category === "trade" ? "トレード" : "デッキ"}
                  </Badge>
                  {!notification.is_read && (
                    <Badge variant="destructive" className="text-xs">
                      未読
                    </Badge>
                  )}
                </div>

                <p className="text-sm text-gray-800 mb-2">{notification.content}</p>

                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">{new Date(notification.created_at).toLocaleString("ja-JP")}</p>

                  <div className="flex gap-2">
                    <Link href={getNotificationLink(notification)}>
                      <Button variant="outline" size="sm" onClick={() => handleMarkAsRead(notification)}>
                        確認する
                      </Button>
                    </Link>
                    {!notification.is_read && (
                      <Button variant="ghost" size="sm" onClick={() => handleMarkAsRead(notification)}>
                        既読にする
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
