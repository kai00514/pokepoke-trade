"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react" // useCallback をインポート
import type { User } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"
import { getUserProfile } from "@/lib/services/user-service"

interface UserProfile {
  id: string
  user_name: string | null
  avatar_url: string | null
}

interface AuthContextType {
  user: User | null
  userProfile: UserProfile | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  // ユーザーとプロフィールをフェッチする共通関数
  const fetchUserAndProfile = useCallback(async () => {
    console.log("🔄 fetchUserAndProfile called...")
    setLoading(true)
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError) {
        console.error("❌ Error getting session in fetchUserAndProfile:", sessionError)
        setUser(null)
        setUserProfile(null)
      } else {
        const currentUser = session?.user ?? null
        setUser(currentUser)
        console.log("✅ User set:", currentUser ? currentUser.id : "null")

        if (currentUser) {
          const profileResult = await getUserProfile(currentUser.id)
          if (profileResult.success && profileResult.profile) {
            setUserProfile(profileResult.profile)
            console.log("✅ User profile set:", profileResult.profile.user_name)
          } else {
            console.warn("⚠️ User profile not found or error in fetchUserAndProfile:", profileResult.error)
            setUserProfile(null)
          }
        } else {
          setUserProfile(null)
          console.log("ℹ️ No current user, userProfile cleared.")
        }
      }
    } catch (err) {
      console.error("❌ Unexpected error in fetchUserAndProfile:", err)
      setUser(null)
      setUserProfile(null)
    } finally {
      setLoading(false)
      console.log("✅ fetchUserAndProfile finished. Loading:", false)
    }
  }, [supabase]) // supabase を依存配列に追加

  useEffect(() => {
    // 初期セッションの取得
    fetchUserAndProfile()

    // 認証状態の変更を監視
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔄 Auth state change detected:", event, session?.user ? "logged in" : "logged out")
      // SIGNED_OUT イベントの場合、即座に状態をクリアし、リダイレクト
      if (event === "SIGNED_OUT") {
        console.log("👋 SIGNED_OUT event received. Clearing user state and redirecting.")
        setUser(null)
        setUserProfile(null)
        setLoading(false) // ローディングを解除
        window.location.href = "/" // トップページにリダイレクト
        return // 以降の処理は不要
      }
      // その他のイベント（SIGNED_IN, USER_UPDATEDなど）の場合は再フェッチ
      fetchUserAndProfile()
    })

    return () => {
      console.log("🧹 Cleaning up auth subscription")
      subscription.unsubscribe()
    }
  }, [supabase.auth, fetchUserAndProfile]) // fetchUserAndProfile を依存配列に追加

  const signOut = useCallback(async () => {
    console.log("👋 Attempting to sign out...")
    setLoading(true)
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error("❌ Supabase signOut error:", error)
        throw error
      }
      console.log("✅ Supabase signOut successful. Forcing state refresh and redirect.")
      // SupabaseのsignOutが成功したら、明示的に状態をリフレッシュし、リダイレクト
      setUser(null)
      setUserProfile(null)
      setLoading(false)
      window.location.href = "/" // トップページにリダイレクト
    } catch (error) {
      console.error("❌ Error during signOut process:", error)
      setLoading(false) // エラー時もローディングを解除
    }
  }, [supabase]) // supabase を依存配列に追加

  // デバッグ情報をコンソールに出力
  useEffect(() => {
    console.log("🔍 Auth Context State (Render):", {
      user: user ? { id: user.id, email: user.email } : null,
      userProfile,
      loading,
    })
  }, [user, userProfile, loading])

  return <AuthContext.Provider value={{ user, userProfile, loading, signOut }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
