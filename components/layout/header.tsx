"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Plus, User } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import NotificationDropdown from "@/components/notification-dropdown"
import { PokepokeIdRegistrationModal } from "@/components/pokepoke-id-registration-modal"
import { UsernameRegistrationModal } from "@/components/username-registration-modal"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "@/components/ui/use-toast"

export default function Header() {
  const { user, userProfile, loading, signOut, refreshUserProfile } = useAuth()
  const [isPokepokeIdModalOpen, setIsPokepokeIdModalOpen] = useState(false)
  const [isUsernameModalOpen, setIsUsernameModalOpen] = useState(false)
  const supabase = createClient()

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

  const handlePokepokeIdSave = async (pokepokeId: string) => {
    if (!user) {
      toast({
        title: "エラー",
        description: "ユーザーが認証されていません。",
        variant: "destructive",
      })
      return
    }

    console.log("🔄 Saving pokepoke_id:", pokepokeId, "for user:", user.id)

    try {
      // 既存のレコードを確認
      const { data: existingUser, error: fetchError } = await supabase
        .from("users")
        .select("id, name, email, display_name, pokepoke_id, avatar_url, is_admin")
        .eq("id", user.id)
        .maybeSingle()

      console.log("📋 Existing user data:", existingUser)

      if (fetchError) {
        console.error("❌ Error fetching existing user:", fetchError)
        toast({
          title: "エラー",
          description: `データ取得エラー: ${fetchError.message}`,
          variant: "destructive",
        })
        return
      }

      let result
      if (existingUser) {
        // 既存レコードを更新
        console.log("🔄 Updating existing user record")
        result = await supabase
          .from("users")
          .update({
            pokepoke_id: pokepokeId,
          })
          .eq("id", user.id)
          .select("id, name, email, display_name, pokepoke_id, avatar_url, is_admin")
      } else {
        // 新しいレコードを挿入
        console.log("🔄 Inserting new user record")
        result = await supabase
          .from("users")
          .insert({
            id: user.id,
            name: user.user_metadata?.full_name || user.user_metadata?.name || null,
            email: user.email || null,
            pokepoke_id: pokepokeId,
            display_name: null,
            avatar_url: user.user_metadata?.avatar_url || null,
            is_admin: false,
          })
          .select("id, name, email, display_name, pokepoke_id, avatar_url, is_admin")
      }

      const { data, error } = result

      if (error) {
        console.error("❌ Database operation error:", error)
        toast({
          title: "エラー",
          description: `データベースエラー: ${error.message}`,
          variant: "destructive",
        })
        return
      }

      console.log("✅ Database operation successful:", data)

      toast({
        title: "成功",
        description: "ポケポケIDが更新されました。",
      })

      await refreshUserProfile() // プロファイルを再フェッチしてヘッダーを更新
      setIsPokepokeIdModalOpen(false) // モーダルを閉じる
    } catch (error) {
      console.error("❌ Unexpected error:", error)
      toast({
        title: "エラー",
        description: "予期しないエラーが発生しました。",
        variant: "destructive",
      })
    }
  }

  const handleUsernameSave = async (username: string) => {
    if (!user) {
      toast({
        title: "エラー",
        description: "ユーザーが認証されていません。",
        variant: "destructive",
      })
      return
    }

    console.log("🔄 Saving display_name:", username, "for user:", user.id)

    try {
      // 既存のレコードを確認
      const { data: existingUser, error: fetchError } = await supabase
        .from("users")
        .select("id, name, email, display_name, pokepoke_id, avatar_url, is_admin")
        .eq("id", user.id)
        .maybeSingle()

      console.log("📋 Existing user data:", existingUser)

      if (fetchError) {
        console.error("❌ Error fetching existing user:", fetchError)
        toast({
          title: "エラー",
          description: `データ取得エラー: ${fetchError.message}`,
          variant: "destructive",
        })
        return
      }

      let result
      if (existingUser) {
        // 既存レコードを更新
        console.log("🔄 Updating existing user record")
        result = await supabase
          .from("users")
          .update({
            display_name: username,
          })
          .eq("id", user.id)
          .select("id, name, email, display_name, pokepoke_id, avatar_url, is_admin")
      } else {
        // 新しいレコードを挿入
        console.log("🔄 Inserting new user record")
        result = await supabase
          .from("users")
          .insert({
            id: user.id,
            name: user.user_metadata?.full_name || user.user_metadata?.name || null,
            email: user.email || null,
            display_name: username,
            pokepoke_id: null,
            avatar_url: user.user_metadata?.avatar_url || null,
            is_admin: false,
          })
          .select("id, name, email, display_name, pokepoke_id, avatar_url, is_admin")
      }

      const { data, error } = result

      if (error) {
        console.error("❌ Database operation error:", error)
        toast({
          title: "エラー",
          description: `データベースエラー: ${error.message}`,
          variant: "destructive",
        })
        return
      }

      console.log("✅ Database operation successful:", data)

      toast({
        title: "成功",
        description: "ユーザー名が更新されました。",
      })

      await refreshUserProfile() // プロファイルを再フェッチしてヘッダーを更新
      setIsUsernameModalOpen(false) // モーダルを閉じる
    } catch (error) {
      console.error("❌ Unexpected error:", error)
      toast({
        title: "エラー",
        description: "予期しないエラーが発生しました。",
        variant: "destructive",
      })
    }
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
                    {userProfile?.display_name || userProfile?.name || user.email?.split("@")[0] || "ユーザー"}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setIsPokepokeIdModalOpen(true)} className="cursor-pointer">
                  ポケポケID登録
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsUsernameModalOpen(true)} className="cursor-pointer">
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

      {/* ポケポケID登録モーダル */}
      <PokepokeIdRegistrationModal
        isOpen={isPokepokeIdModalOpen}
        onOpenChange={setIsPokepokeIdModalOpen}
        currentPokepokeId={userProfile?.pokepoke_id}
        onSave={handlePokepokeIdSave}
      />

      {/* ユーザー名登録モーダル */}
      <UsernameRegistrationModal
        isOpen={isUsernameModalOpen}
        onOpenChange={setIsUsernameModalOpen}
        currentUsername={userProfile?.display_name}
        onSave={handleUsernameSave}
      />
    </header>
  )
}
