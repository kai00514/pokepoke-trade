"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Menu, User, LogOut, Settings, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/contexts/auth-context"
import NotificationDropdown from "@/components/notification-dropdown"
import { getUserProfile } from "@/lib/services/user-service"

interface UserProfile {
  pokepoke_id?: string
  display_name?: string
}

function Header() {
  const { user, loading, signOut } = useAuth()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [displayName, setDisplayName] = useState<string>("")

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user?.id) {
        try {
          const profile = await getUserProfile(user.id)
          setUserProfile(profile)

          // 表示名の優先順位: display_name > pokepoke_id > email
          const name = profile?.display_name || profile?.pokepoke_id || user.email?.split("@")[0] || "ユーザー"
          setDisplayName(name)
        } catch (error) {
          console.error("Error fetching user profile:", error)
          setDisplayName(user.email?.split("@")[0] || "ユーザー")
        }
      }
    }

    if (user && !loading) {
      fetchUserProfile()
    }
  }, [user, loading])

  // デバッグ用ログ
  console.log("🔍 Header component - Auth state:", {
    user: user?.email || null,
    userProfile,
    loading,
    displayName,
  })

  if (loading) {
    return (
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-xl font-bold text-blue-600">
              PokeLink
            </Link>
            <div className="flex items-center space-x-4">
              <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200" />
            </div>
          </div>
        </div>
      </header>
    )
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      setUserProfile(null)
      setDisplayName("")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  console.log("Header render - user:", user ? `logged in as ${user.email}` : "not logged in")

  return (
    <header className="border-b bg-white">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-blue-600">
            PokeLink
          </Link>

          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/trades/create" className="text-gray-600 hover:text-gray-900">
              トレード投稿
            </Link>
            <Link href="/decks" className="text-gray-600 hover:text-gray-900">
              デッキ
            </Link>
            <Link href="/matching" className="text-gray-600 hover:text-gray-900">
              マッチング
            </Link>
            <Link href="/history" className="text-gray-600 hover:text-gray-900">
              履歴
            </Link>
            <Link href="/info" className="text-gray-600 hover:text-gray-900">
              お知らせ
            </Link>
          </nav>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <NotificationDropdown />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span className="hidden sm:inline">{displayName}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild>
                      <Link href="/favorites" className="flex items-center">
                        <Heart className="mr-2 h-4 w-4" />
                        お気に入り
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/settings" className="flex items-center">
                        <Settings className="mr-2 h-4 w-4" />
                        設定
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="flex items-center text-red-600">
                      <LogOut className="mr-2 h-4 w-4" />
                      ログアウト
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Button asChild variant="ghost" size="sm">
                  <Link href="/auth/login">ログイン</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/auth/signup">新規登録</Link>
                </Button>
              </div>
            )}

            <Button variant="ghost" size="sm" className="md:hidden">
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}

// Named export
export { Header }

// Default export
export default Header
