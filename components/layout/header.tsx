"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Plus, User, LogOut, Settings } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/contexts/auth-context"
import NotificationDropdown from "@/components/notification-dropdown"
import { useToast } from "@/components/ui/use-toast"

export default function Header() {
  const { user, signOut } = useAuth()
  const { toast } = useToast()

  console.log("Header render - user:", user?.email || "not logged in")

  const handleSignOut = async () => {
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

  const getDisplayName = () => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name
    }
    if (user?.email) {
      return user.email.split("@")[0]
    }
    return "ユーザー"
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
                    {user?.user_metadata?.avatar_url ? (
                      <Image
                        src={user.user_metadata.avatar_url || "/placeholder.svg"}
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
                  <span className="text-white text-sm font-medium hidden sm:inline">{getDisplayName()}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    プロフィール
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="flex items-center cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    設定
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="flex items-center cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
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
