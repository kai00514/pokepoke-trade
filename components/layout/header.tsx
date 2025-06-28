"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Plus, User } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import NotificationDropdown from "@/components/notification-dropdown"

export default function Header() {
  const { user, userProfile, loading, signOut } = useAuth()

  console.log("🔍 Header component - Auth state:", {
    user: user ? { id: user.id, email: user.email } : null,
    userProfile,
    loading,
  })

  const handleSignOut = async () => {
    try {
      await signOut()
      console.log("✅ Signed out successfully from Header")
    } catch (error) {
      console.error("❌ Sign out error:", error)
    }
  }

  // 仮のハンドラ関数
  const handlePokepokeIdRegistration = () => {
    console.log("ポケポケID登録がクリックされました。")
    // ここにポケポケID登録ページへの遷移ロジックなどを追加
  }

  // 仮のハンドラ関数
  const handleUsernameRegistration = () => {
    console.log("ユーザー名登録がクリックされました。")
    // ここにユーザー名登録ページへの遷移ロジックなどを追加
  }

  return (
    <header className="bg-violet-500 text-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <Image src="/pokelink-logo.png" alt="PokeLink ロゴ" width={160} height={40} className="object-contain h-10" />
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="bg-white text-violet-600 hover:bg-violet-100 rounded-full h-9 w-9 sm:h-10 sm:w-10"
            aria-label="新規投稿作成"
          >
            <Plus className="h-5 w-5 sm:h-6 sm:w-6" />
            <span className="sr-only">新規投稿作成</span>
          </Button>

          {/* 通知ドロップダウンコンポーネントを使用 */}
          {user && <NotificationDropdown />}

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 bg-white/10 rounded-full px-3 py-1.5 hover:bg-white/20 transition-colors duration-200 cursor-pointer"
                  aria-label="ユーザーメニューを開く"
                >
                  <div className="relative w-6 h-6 sm:w-8 sm:h-8">
                    {userProfile?.avatar_url ? (
                      <Image
                        src={userProfile.avatar_url || "/placeholder.svg"}
                        alt="ユーザーアバター"
                        width={32}
                        height={32}
                        className="rounded-full object-cover w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full bg-white/20 rounded-full flex items-center justify-center">
                        <User className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                      </div>
                    )}
                  </div>
                  <span className="text-white text-sm font-medium hidden sm:inline">
                    {userProfile?.user_name || user.email?.split("@")[0] || "ユーザー"}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={handlePokepokeIdRegistration} className="cursor-pointer">
                  ポケポケID登録
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleUsernameRegistration} className="cursor-pointer">
                  ユーザー名登録
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                  ログアウト
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link href="/auth/signup">
                <Button
                  variant="default"
                  className="bg-white text-violet-600 hover:bg-violet-100 text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2"
                >
                  新規登録
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button
                  variant="outline"
                  className="bg-white text-violet-600 border-violet-600 hover:bg-violet-100 hover:text-violet-700 text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2"
                >
                  ログイン
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
