"use client"

import type React from "react"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { DropdownMenuTrigger, DropdownMenuContent, DropdownMenu } from "@/components/ui/dropdown-menu"
import {
  BellIcon,
  HomeIcon,
  UserIcon,
  LogOutIcon,
  SettingsIcon,
  MessageSquareIcon,
  HeartIcon,
  BarChartIcon,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import NotificationDropdown from "./notification-dropdown"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { LoginPrompt } from "./login-prompt" // LoginPromptをインポート

export default function Header() {
  const { user, displayName, loading } = useAuth()
  const router = useRouter()
  const supabase = createClient()
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  const handleNotificationClick = (e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault() // デフォルトのリンク遷移を防止
      setShowLoginPrompt(true) // ログインプロンプトを表示
    }
    // ログインしている場合はNotificationDropdownが内部で処理するため何もしない
  }

  return (
    <header className="flex h-16 w-full items-center justify-between px-4 md:px-6 border-b bg-white">
      <Link className="flex items-center gap-2" href="/">
        <img src="/pokelink-logo.png" alt="Pokelink Logo" className="h-8 w-auto" />
        <span className="sr-only">Pokelink</span>
      </Link>
      <nav className="hidden md:flex items-center gap-4">
        <Link className="flex items-center gap-2 text-sm font-medium hover:underline" href="/">
          <HomeIcon className="h-4 w-4" />
          ホーム
        </Link>
        <Link className="flex items-center gap-2 text-sm font-medium hover:underline" href="/trades">
          <MessageSquareIcon className="h-4 w-4" />
          トレード
        </Link>
        <Link className="flex items-center gap-2 text-sm font-medium hover:underline" href="/decks">
          <BarChartIcon className="h-4 w-4" />
          デッキ
        </Link>
        <Link className="flex items-center gap-2 text-sm font-medium hover:underline" href="/favorites">
          <HeartIcon className="h-4 w-4" />
          お気に入り
        </Link>
      </nav>
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon" className="relative" onClick={handleNotificationClick}>
          <Link href={user ? "#" : "/auth/login"}>
            {" "}
            {/* ログインしていればモーダル、そうでなければログインページ */}
            <BellIcon className="h-5 w-5" />
            <span className="sr-only">通知</span>
            {/* 未読通知のバッジなどをここに追加 */}
          </Link>
        </Button>
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="rounded-full" size="icon" variant="ghost">
                <UserIcon className="h-5 w-5" />
                <span className="sr-only">ユーザーメニュー</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <div className="flex items-center gap-2 p-2">
                <UserIcon className="h-4 w-4" />
                <span className="font-medium">{displayName}</span>
              </div>
              <Link href="/profile">
                <Button variant="ghost" className="w-full justify-start">
                  <UserIcon className="mr-2 h-4 w-4" />
                  プロフィール
                </Button>
              </Link>
              <Link href="/settings">
                <Button variant="ghost" className="w-full justify-start">
                  <SettingsIcon className="mr-2 h-4 w-4" />
                  設定
                </Button>
              </Link>
              <Button onClick={handleLogout} variant="ghost" className="w-full justify-start text-red-500">
                <LogOutIcon className="mr-2 h-4 w-4" />
                ログアウト
              </Button>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button asChild>
            <Link href="/auth/login">ログイン</Link>
          </Button>
        )}
      </div>
      <LoginPrompt open={showLoginPrompt} setOpen={setShowLoginPrompt} />
      {user && <NotificationDropdown />} {/* ログインしている場合のみNotificationDropdownを表示 */}
    </header>
  )
}
