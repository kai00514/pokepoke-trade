"use client"

import { useState, useEffect, useRef } from "react"
import { Bell, X, Loader2, ExternalLink, AlertCircle, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAuth } from "@/contexts/auth-context"
import { getNotifications, markNotificationAsRead, subscribeToNotifications } from "@/lib/services/notification-service"
import type { Notification } from "@/types/notification"
import Link from "next/link"

export default function NotificationDropdown() {
  const { user, loading: authLoading } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // コンポーネントがマウントされたことをログ出力
  useEffect(() => {
    console.log("🔔 NotificationDropdown mounted")
    return () => {
      console.log("🔔 NotificationDropdown unmounted")
    }
  }, [])

  // レンダリング時のデバッグログ
  console.log("🔔 NotificationDropdown render:", {
    user: user ? { id: user.id, email: user.email } : null,
    authLoading,
    isOpen,
    unreadCount,
    notificationsCount: notifications.length,
    willRender: !authLoading && !!user,
  })

  // 通知を取得
  const fetchNotifications = async () => {
    if (!user) {
      console.log("❌ Cannot fetch notifications: user is null")
      return
    }

    console.log("📡 Fetching notifications for user:", user.id)
    setIsLoading(true)
    setError(null)

    try {
      const result = await getNotifications(user.id)
      console.log("📨 Notifications result:", result)

      if (result.success && result.notifications) {
        setNotifications(result.notifications)
        const unread = result.notifications.filter((n) => !n.is_read).length
        setUnreadCount(unread)
        console.log(`✅ Loaded ${result.notifications.length} notifications, ${unread} unread`)
      } else {
        const errorMsg = result.error || "通知の取得に失敗しました"
        setError(errorMsg)
        console.error("❌ Failed to fetch notifications:", errorMsg)
      }
    } catch (error) {
      console.error("❌ Error fetching notifications:", error)
      setError("通知の取得中にエラーが発生しました")
    } finally {
      setIsLoading(false)
    }
  }

  // ドロップダウンを開く/閉じる
  const toggleDropdown = () => {
    console.log("🔄 Toggle dropdown clicked:", {
      currentState: isOpen,
      user: !!user,
      authLoading,
      timestamp: new Date().toISOString(),
    })

    if (!user && !authLoading) {
      console.log("❌ Cannot toggle dropdown: user not authenticated")
      return
    }

    if (!isOpen && user) {
      console.log("📡 Will fetch notifications...")
      fetchNotifications()
    }
    setIsOpen(!isOpen)
    console.log("🔄 Dropdown state changed to:", !isOpen)
  }

  // 通知を既読にする
  const handleMarkAsRead = async (notification: Notification) => {
    if (notification.is_read) return

    try {
      const result = await markNotificationAsRead(notification.id, notification.source)
      if (result.success) {
        setNotifications((prev) => prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n)))
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  // 外側クリックでドロップダウンを閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        console.log("🖱️ Outside click detected, closing dropdown")
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  // 初期化時に未読数を取得
  useEffect(() => {
    if (user && !authLoading) {
      console.log("🚀 Initial notification fetch for user:", user.id)
      fetchNotifications()
    }
  }, [user, authLoading])

  // リアルタイム通知の購読
  useEffect(() => {
    if (!user) return

    console.log("🔔 Setting up real-time subscription for user:", user.id)
    const unsubscribe = subscribeToNotifications(user.id, (newNotification) => {
      console.log("🆕 New notification received:", newNotification)
      setNotifications((prev) => [newNotification, ...prev])
      setUnreadCount((prev) => prev + 1)
    })

    return unsubscribe
  }, [user])

  // ESCキーでドロップダウンを閉じる
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        console.log("⌨️ ESC key pressed, closing dropdown")
        setIsOpen(false)
        buttonRef.current?.focus()
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscKey)
      return () => document.removeEventListener("keydown", handleEscKey)
    }
  }, [isOpen])

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

  // 認証中の場合は何も表示しない
  if (authLoading) {
    console.log("⏳ Auth loading, not rendering notification dropdown")
    return null
  }

  // 未認証の場合は何も表示しない
  if (!user) {
    console.log("👤 No user, not rendering notification dropdown")
    return null
  }

  console.log("✅ Rendering NotificationDropdown component")

  return (
    <div className="relative">
      {/* 通知ベルアイコン */}
      <Button
        ref={buttonRef}
        variant="ghost"
        size="icon"
        className="relative text-white hover:bg-white/20 rounded-full h-9 w-9 sm:h-10 sm:w-10 transition-all duration-200 ease-in-out focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-violet-500"
        onClick={(e) => {
          console.log("🖱️ Button clicked!", e)
          toggleDropdown()
        }}
        onMouseDown={(e) => {
          console.log("🖱️ Button mouse down!", e)
        }}
        aria-label={`通知 ${unreadCount > 0 ? `(${unreadCount}件の未読)` : ""}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Bell className="h-5 w-5 sm:h-6 sm:w-6" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs font-bold border-2 border-violet-500"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </Badge>
        )}
      </Button>

      {/* 通知ドロップダウン */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
          role="dialog"
          aria-label="通知リスト"
          style={{ maxHeight: "500px" }}
        >
          <Card className="border-0 shadow-none">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-gray-900">通知</CardTitle>
                <div className="flex items-center gap-2">
                  {/* デバッグ情報 (開発時のみ) */}
                  {process.env.NODE_ENV === "development" && (
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <User className="h-3 w-3" />
                      <span>{user.email}</span>
                    </div>
                  )}
                  {notifications.length > 0 && (
                    <Link href="/notifications">
                      <Button variant="ghost" size="sm" className="text-xs">
                        すべて表示
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </Button>
                    </Link>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => {
                      console.log("❌ Close button clicked")
                      setIsOpen(false)
                    }}
                    aria-label="通知を閉じる"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {error && (
                <div className="p-4 bg-red-50 border-b border-red-200">
                  <div className="flex items-center gap-2 text-red-700">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">{error}</span>
                  </div>
                </div>
              )}

              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  <span className="ml-2 text-sm text-gray-600">読み込み中...</span>
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-8 px-4">
                  <Bell className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                  <p className="text-sm text-gray-600">通知はありません</p>
                  <p className="text-xs text-gray-400 mt-2">User ID: {user?.id}</p>
                </div>
              ) : (
                <ScrollArea className="h-96">
                  <div className="space-y-1">
                    {notifications.slice(0, 10).map((notification, index) => (
                      <div
                        key={notification.id}
                        className={`p-3 hover:bg-gray-50 transition-colors ${
                          !notification.is_read ? "bg-blue-50 border-l-2 border-l-blue-500" : ""
                        } ${index !== notifications.length - 1 ? "border-b border-gray-100" : ""}`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`p-1.5 rounded-full flex-shrink-0 ${
                              notification.source === "trade"
                                ? "bg-green-100 text-green-600"
                                : "bg-purple-100 text-purple-600"
                            }`}
                          >
                            <Bell className="h-3 w-3" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge
                                variant="outline"
                                className={`text-xs ${
                                  notification.source === "trade"
                                    ? "border-green-200 text-green-700"
                                    : "border-purple-200 text-purple-700"
                                }`}
                              >
                                {notification.source === "trade" ? "トレード" : "デッキ"}
                              </Badge>
                              {!notification.is_read && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                              )}
                            </div>

                            <p className="text-sm text-gray-800 mb-2 line-clamp-2">{notification.content}</p>

                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500">{formatTimeAgo(notification.created_at)}</span>

                              <Link
                                href={getNotificationLink(notification)}
                                onClick={() => {
                                  handleMarkAsRead(notification)
                                  setIsOpen(false)
                                }}
                              >
                                <Button variant="ghost" size="sm" className="text-xs h-6 px-2">
                                  確認
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
