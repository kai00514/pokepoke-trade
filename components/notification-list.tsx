"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Bell, MessageCircle, FileText } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { markNotificationAsRead, markAllNotificationsAsRead } from "@/lib/services/notification-service"
import type { Notification } from "@/types/notification"
import Link from "next/link"

interface NotificationListProps {
  notifications: Notification[]
  onNotificationRead?: (notificationId: string) => void
}

export default function NotificationList({ notifications, onNotificationRead }: NotificationListProps) {
  const { user } = useAuth()
  const [localNotifications, setLocalNotifications] = useState<Notification[]>(notifications)
  const [isMarkingAllAsRead, setIsMarkingAllAsRead] = useState(false)

  useEffect(() => {
    setLocalNotifications(notifications)
  }, [notifications])

  const handleMarkAsRead = async (notification: Notification) => {
    if (notification.is_read) return

    console.log("📝 Marking notification as read:", notification.id)
    const result = await markNotificationAsRead(notification.id, notification.source)
    if (result.success) {
      setLocalNotifications((prev) => prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n)))
      onNotificationRead?.(notification.id)
    }
  }

  const handleMarkAllAsRead = async () => {
    if (!user || isMarkingAllAsRead) return

    setIsMarkingAllAsRead(true)
    try {
      const result = await markAllNotificationsAsRead(user.id)
      if (result.success) {
        setLocalNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
        // 親コンポーネントに全ての通知IDを通知
        localNotifications.filter((n) => !n.is_read).forEach((n) => onNotificationRead?.(n.id))
      }
    } catch (error) {
      console.error("❌ Error marking all as read:", error)
    } finally {
      setIsMarkingAllAsRead(false)
    }
  }

  const getNotificationIcon = (type: string) => {
    if (type.includes("comment")) {
      return <MessageCircle className="h-4 w-4" />
    }
    return <FileText className="h-4 w-4" />
  }

  const getNotificationLink = (notification: Notification) => {
    if (notification.source === "trade") {
      return `/trades/${notification.related_id}`
    } else {
      return `/content/${notification.related_id}`
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return "たった今"
    if (diffInMinutes < 60) return `${diffInMinutes}分前`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}時間前`
    return `${Math.floor(diffInMinutes / 1440)}日前`
  }

  const unreadCount = localNotifications.filter((n) => !n.is_read).length

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
      {/* 一括既読ボタン */}
      {unreadCount > 0 && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllAsRead}
            disabled={isMarkingAllAsRead}
            className="text-sm"
          >
            {isMarkingAllAsRead ? "処理中..." : `すべて既読にする (${unreadCount}件)`}
          </Button>
        </div>
      )}

      {localNotifications.map((notification) => (
        <Link
          key={notification.id}
          href={getNotificationLink(notification)}
          onClick={() => handleMarkAsRead(notification)}
          className="block"
        >
          <Card
            className={`transition-all hover:shadow-lg cursor-pointer border-l-4 ${
              !notification.is_read
                ? "border-l-blue-500 bg-blue-50 hover:bg-blue-100"
                : "border-l-gray-300 hover:bg-gray-50"
            }`}
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div
                  className={`p-3 rounded-full ${
                    notification.source === "trade" ? "bg-green-100 text-green-600" : "bg-purple-100 text-purple-600"
                  }`}
                >
                  {getNotificationIcon(notification.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge
                      variant={notification.source === "trade" ? "default" : "secondary"}
                      className={
                        notification.source === "trade"
                          ? "bg-green-100 text-green-800 hover:bg-green-200"
                          : "bg-purple-100 text-purple-800 hover:bg-purple-200"
                      }
                    >
                      {notification.source === "trade" ? "トレード" : "デッキ"}
                    </Badge>
                    {!notification.is_read && (
                      <Badge variant="destructive" className="text-xs">
                        未読
                      </Badge>
                    )}
                    <span className="text-sm text-gray-500 ml-auto">{formatTimeAgo(notification.created_at)}</span>
                  </div>

                  <p className="text-base text-gray-800 leading-relaxed mb-3">{notification.content}</p>

                  <div className="flex items-center justify-between">
                    {!notification.is_read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          handleMarkAsRead(notification)
                        }}
                        className="text-gray-600 hover:text-gray-800 ml-auto"
                      >
                        既読にする
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
