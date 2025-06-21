"use client"

import { useState, useEffect, useRef } from "react"
import { Bell, X, Loader2, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAuth } from "@/contexts/auth-context"
import { getNotifications, markNotificationAsRead, subscribeToNotifications } from "@/lib/services/notification-service"
import type { Notification } from "@/types/notification"
import Link from "next/link"

export default function NotificationDropdown() {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // 通知を取得
  const fetchNotifications = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const result = await getNotifications(user.id)
      if (result.success && result.notifications) {
        setNotifications(result.notifications)
        setUnreadCount(result.notifications.filter((n) => !n.is_read).length)
      }
    } catch (error) {
      console.error("Error fetching notifications:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // ドロップダウンを開く/閉じる
  const toggleDropdown = () => {
    if (!isOpen && user) {
      fetchNotifications()
    }
    setIsOpen(!isOpen)
  }

  // 通知を既読にする
  const handleMarkAsRead = async (notification: Notification) => {
    if (notification.is_read) return

    const result = await markNotificationAsRead(notification.id, notification.source)
    if (result.success) {
      setNotifications((prev) => prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n)))
      setUnreadCount((prev) => Math.max(0, prev - 1))
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
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  // リアルタイム通知の購読
  useEffect(() => {
    if (!user) return

    const unsubscribe = subscribeToNotifications(user.id, (newNotification) => {
      setNotifications((prev) => [newNotification, ...prev])
      setUnreadCount((prev) => prev + 1)
    })

    return unsubscribe
  }, [user])

  // ESCキーでドロップダウンを閉じる
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
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

  if (!user) {
    return null
  }

  return (
    <div className="relative">
      {/* 通知ベルアイコン */}
      <Button
        ref={buttonRef}
        variant="ghost"
        size="icon"
        className="relative bg-white text-violet-600 hover:bg-violet-100 rounded-full h-9 w-9 sm:h-10 sm:w-10"
        onClick={toggleDropdown}
        aria-label={`通知 ${unreadCount > 0 ? `(${unreadCount}件の未読)` : ""}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Bell className="h-5 w-5 sm:h-6 sm:w-6" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs font-bold"
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
        >
          <Card className="border-0 shadow-none">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">通知</CardTitle>
                <div className="flex items-center gap-2">
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
                    onClick={() => setIsOpen(false)}
                    aria-label="通知を閉じる"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  <span className="ml-2 text-sm text-gray-600">読み込み中...</span>
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-8 px-4">
                  <Bell className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                  <p className="text-sm text-gray-600">通知はありません</p>
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
