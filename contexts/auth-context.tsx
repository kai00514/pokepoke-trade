"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client" // createClient をインポート
import { getUserProfile } from "@/lib/services/user-service" // ユーザープロフィールサービスをインポート

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
  const supabase = createClient() // createClient を使用

  useEffect(() => {
    // 初期セッションを取得
    const getInitialSession = async () => {
      console.log("🚀 Getting initial auth session...")
      setLoading(true)
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()
        if (error) {
          console.error("Initial session error:", error)
          setUser(null)
          setUserProfile(null)
        } else {
          const currentUser = session?.user ?? null
          setUser(currentUser)
          if (currentUser) {
            const profileResult = await getUserProfile(currentUser.id)
            if (profileResult.success && profileResult.profile) {
              setUserProfile(profileResult.profile)
              console.log("✅ Initial user profile loaded:", profileResult.profile.user_name)
            } else {
              console.warn("⚠️ Initial user profile not found or error:", profileResult.error)
              setUserProfile(null)
            }
          } else {
            setUserProfile(null)
          }
          console.log("✅ Initial session loaded:", currentUser ? "logged in" : "logged out")
        }
      } catch (error) {
        console.error("Error getting initial session:", error)
        setUser(null)
        setUserProfile(null)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // 認証状態の変更を監視
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔄 Auth state change:", event, session?.user ? "logged in" : "logged out")
      setLoading(true) // 状態変更中はローディングを設定

      const currentUser = session?.user ?? null
      setUser(currentUser)

      if (currentUser) {
        // ユーザーが存在する場合のみプロフィールを取得
        const profileResult = await getUserProfile(currentUser.id)
        if (profileResult.success && profileResult.profile) {
          setUserProfile(profileResult.profile)
          console.log("✅ User profile fetched:", profileResult.profile.user_name)
        } else {
          console.warn("⚠️ User profile not found or error:", profileResult.error)
          setUserProfile(null)
        }
      } else {
        // ユーザーがいない場合はプロフィールをクリア
        setUserProfile(null)
      }
      setLoading(false) // 処理完了後にローディングを解除
    })

    return () => {
      console.log("🧹 Cleaning up auth subscription")
      subscription.unsubscribe()
    }
  }, [supabase.auth]) // supabase.auth を依存配列に追加

  const signOut = async () => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error("❌ Sign out error:", error)
        throw error
      }
      setUser(null)
      setUserProfile(null)
      console.log("✅ User signed out successfully.")
      window.location.href = "/" // 例: トップページにリダイレクト
    } catch (error) {
      console.error("Error during sign out:", error)
    } finally {
      setLoading(false)
    }
  }

  // デバッグ情報をコンソールに出力
  useEffect(() => {
    console.log("🔍 Auth Context State:", {
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
