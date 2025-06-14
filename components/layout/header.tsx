"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Plus, Bell, LogOut, UserIcon } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/components/ui/use-toast"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function Header() {
  const { user, loading, signOut } = useAuth()
  const { toast } = useToast()

  const handleLogout = async () => {
    try {
      await signOut()
      toast({
        title: "ログアウト完了",
        description: "ログアウトしました。",
      })
    } catch (error) {
      toast({
        title: "エラー",
        description: "ログアウトに失敗しました。",
        variant: "destructive",
      })
    }
  }

  const getUserDisplayName = () => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name
    }
    if (user?.email) {
      return user.email.split("@")[0]
    }
    return "ユーザー"
  }

  const getUserAvatar = () => {
    return user?.user_metadata?.avatar_url || null
  }

  return (
    <header className="bg-violet-500 text-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <Image src="/pokelink-logo.png" alt="PokeLink ロゴ" width={160} height={40} className="object-contain h-10" />
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-full animate-pulse" />
              <div className="w-16 h-6 bg-white/20 rounded animate-pulse" />
            </div>
          ) : user ? (
            // Authenticated user UI
            <>
              {/* Notification Bell */}
              <Button
                variant="ghost"
                size="icon"
                className="bg-white/10 text-white hover:bg-white/20 rounded-full h-9 w-9 sm:h-10 sm:w-10 relative"
                aria-label="通知"
              >
                <Bell className="h-5 w-5 sm:h-6 sm:w-6" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  3
                </span>
              </Button>

              {/* Plus button */}
              <Button
                variant="ghost"
                size="icon"
                className="bg-white text-violet-600 hover:bg-violet-100 rounded-full h-9 w-9 sm:h-10 sm:w-10"
                aria-label="新規投稿作成"
              >
                <Plus className="h-5 w-5 sm:h-6 sm:w-6" />
              </Button>

              {/* User dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="bg-white/10 text-white hover:bg-white/20 h-9 sm:h-10 px-3 rounded-full flex items-center gap-2"
                  >
                    {getUserAvatar() ? (
                      <Image
                        src={getUserAvatar()! || "/placeholder.svg"}
                        alt="ユーザーアバター"
                        width={24}
                        height={24}
                        className="rounded-full"
                      />
                    ) : (
                      <UserIcon className="h-5 w-5" />
                    )}
                    <span className="text-sm font-medium hidden sm:inline">{getUserDisplayName()}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center">
                      <UserIcon className="mr-2 h-4 w-4" />
                      プロフィール
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="flex items-center">
                      <UserIcon className="mr-2 h-4 w-4" />
                      設定
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    ログアウト
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            // Non-authenticated user UI
            <>
              <Button
                variant="ghost"
                size="icon"
                className="bg-white text-violet-600 hover:bg-violet-100 rounded-full h-9 w-9 sm:h-10 sm:w-10"
                aria-label="新規投稿作成"
              >
                <Plus className="h-5 w-5 sm:h-6 sm:w-6" />
              </Button>
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
