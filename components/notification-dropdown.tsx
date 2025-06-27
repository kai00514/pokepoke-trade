"use client"

import Link from "next/link"
import { useState, useEffect, useRef } from "react"
import {
  Bell,
  Loader2,
  AlertCircle,
  ArrowLeft,
  MessageCircle,
  FileText,
  ExternalLink,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useAuth } from "@/contexts/auth-context"
import {
  getNotifications,
  markNotificationAsRead,
  subscribeToNotifications,
  markAllNotificationsAsRead,
} from "@/lib/services/notification-service"
import type { Notification } from "@/types/notification"

export default function NotificationDropdown() {
  const { user, loading: authLoading } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)
  const [showDetail, setShowDetail] = useState(false)
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

  // モーダルを開く
  const handleOpenModal = () => {
    console.log("🔄 Opening notification modal:", {
      user: !!user,
      authLoading,
      timestamp: new Date().toISOString(),
    })

    if (!user && !authLoading) {
      console.log("❌ Cannot open modal: user not authenticated")
      return
    }

    if (user) {
      console.log("📡 Will fetch notifications...")
      fetchNotifications()
    }
    setIsOpen(true)
    setShowDetail(false)
    setSelectedNotification(null)
    console.log("🔄 Modal state changed to: true")
  }

  // モーダルを閉じる
  const handleCloseModal = () => {
    console.log("🔄 Closing notification modal")
    setIsOpen(false)
    setShowDetail(false)
    setSelectedNotification(null)
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

  // 通知詳細を表示
  const handleNotificationClick = (notification: Notification) => {
    setSelectedNotification(notification)
    setShowDetail(true)
    handleMarkAsRead(notification)
  }

  // 詳細画面から戻る
  const handleBackToList = () => {
    setShowDetail(false)
    setSelectedNotification(null)
  }

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

  // ESCキーでモーダルを閉じる
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        if (showDetail) {
          handleBackToList()
        } else {
          console.log("⌨️ ESC key pressed, closing modal")
          handleCloseModal()
          buttonRef.current?.focus()
        }
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscKey)
      return () => document.removeEventListener("keydown", handleEscKey)
    }
  }, [isOpen, showDetail])

  // 通知のリンク先を生成
  const getNotificationLink = (notification: Notification) => {
    if (notification.source === "trade") {
      return `/trades/${notification.related_id}`
    } else {
      return `/content/${notification.related_id}`
    }
  }

  // 通知タイプに応じたアイコン
  const getNotificationIcon = (type: string) => {
    if (type.includes("comment")) {
      return <MessageCircle className="h-4 w-4" />
    }
    return <FileText className="h-4 w-4" />
  }

  // 通知カテゴリに応じたバッジスタイル
  const getCategoryBadge = (source: string, type: string) => {
    if (source === "trade") {
      if (type.includes("comment")) {
        return {
          text: "障害情報",
          className: "bg-red-500 text-white text-xs px-2 py-1 rounded",
        }
      }
      return {
        text: "メンテナンス",
        className: "bg-blue-500 text-white text-xs px-2 py-1 rounded",
      }
    } else {
      if (type.includes("comment")) {
        return {
          text: "更新情報",
          className: "bg-green-500 text-white text-xs px-2 py-1 rounded",
        }
      }
      return {
        text: "イベント",
        className: "bg-orange-500 text-white text-xs px-2 py-1 rounded",
      }
    }
  }

  // 時間のフォーマット
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    const hours = String(date.getHours()).padStart(2, "0")
    const minutes = String(date.getMinutes()).padStart(2, "0")

    return `${year}/${month}/${day} ${hours}:${minutes}`
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
        onClick={handleOpenModal}
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

      {/* 通知モーダル */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md max-h-[80vh] p-0">
          {!showDetail ? (
            // 通知リスト表示
            <>
              <DialogHeader className="p-6 pb-4">
                <DialogTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  通知
                  {unreadCount > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      {unreadCount}
                    </Badge>
                  )}
                </DialogTitle>
              </DialogHeader>

              <div className="px-6 pb-6">
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 text-red-700">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm">{error}</span>
                    </div>
                  </div>
                )}

                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    <span className="ml-2 text-sm text-gray-600">読み込み中...</span>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="text-center py-12">
                    <Bell className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-sm text-gray-600 mb-1">通知はありません</p>
                    <p className="text-xs text-gray-400">新しい通知があるとここに表示されます</p>
                  </div>
                ) : (
                  <ScrollArea className="h-96">
                    <div className="space-y-1">
                      {notifications.slice(0, 15).map((notification) => {
                        const categoryBadge = getCategoryBadge(notification.source, notification.type)
                        return (
                          <div
                            key={notification.id}
                            onClick={() => handleNotificationClick(notification)}
                            className="p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <span className={categoryBadge.className}>{categoryBadge.text}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">{formatTimeAgo(notification.created_at)}</span>
                                <ChevronRight className="h-4 w-4 text-gray-400" />
                              </div>
                            </div>
                            <p className="text-sm text-gray-800 leading-relaxed">{notification.content}</p>
                          </div>
                        )
                      })}
                    </div>
                  </ScrollArea>
                )}

                {notifications.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end">
                    {unreadCount > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          if (!user) return
                          const result = await markAllNotificationsAsRead(user.id)
                          if (result.success) {
                            setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
                            setUnreadCount(0)
                          }
                        }}
                        className="text-sm"
                      >
                        すべて既読
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            // 通知詳細表示
            selectedNotification && (
              <>
                <DialogHeader className="p-6 pb-4">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleBackToList}
                      className="h-8 w-8"
                      aria-label="通知リストに戻る"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <DialogTitle className="flex items-center gap-2">
                      <div
                        className={`p-2 rounded-full ${
                          selectedNotification.source === "trade"
                            ? "bg-green-100 text-green-600"
                            : "bg-purple-100 text-purple-600"
                        }`}
                      >
                        {getNotificationIcon(selectedNotification.type)}
                      </div>
                      通知詳細
                    </DialogTitle>
                  </div>
                </DialogHeader>

                <div className="px-6 pb-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={`${
                          selectedNotification.source === "trade"
                            ? "border-green-200 text-green-700 bg-green-50"
                            : "border-purple-200 text-purple-700 bg-purple-50"
                        }`}
                      >
                        {selectedNotification.source === "trade" ? "トレード" : "デッキ"}
                      </Badge>
                      <span className="text-sm text-gray-500">{formatTimeAgo(selectedNotification.created_at)}</span>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-base text-gray-800 leading-relaxed">{selectedNotification.content}</p>
                    </div>

                    <div className="flex gap-3">
                      <Link
                        href={getNotificationLink(selectedNotification)}
                        onClick={() => setIsOpen(false)}
                        className="flex-1"
                      >
                        <Button className="w-full">
                          詳細ページを開く
                          <ExternalLink className="h-4 w-4 ml-2" />
                        </Button>
                      </Link>
                      <Button variant="outline" onClick={handleBackToList}>
                        戻る
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
