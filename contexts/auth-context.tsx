"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"
import { getUserProfile, getDisplayName } from "@/lib/services/user-service" // UserProfileをインポート

// UserProfileインターフェースをuser-service.tsと同期
interface AuthUserProfile {
  id: string
  avatar_url: string | null
}

interface AuthContextType {
  user: User | null
  userProfile: AuthUserProfile | null // 更新されたUserProfileを使用
  loading: boolean
  displayName: string
  signOut: () => Promise<void>
  refreshUserProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<AuthUserProfile | null>(null) // 更新されたUserProfileを使用
  const [loading, setLoading] = useState(true)
  const [displayName, setDisplayName] = useState<string>("ゲスト")

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
        setDisplayName("ゲスト")
      } else {
        const currentUser = session?.user ?? null
        setUser(currentUser)
        console.log("✅ User set:", currentUser ? currentUser.id : "null")

        if (currentUser) {
          // getUserProfileからavatar_urlのみを取得
          const profileResult = await getUserProfile(currentUser.id)
          if (profileResult.success && profileResult.profile) {
            setUserProfile(profileResult.profile)
            // displayNameはuser.user_metadataとuserProfileのavatar_urlを組み合わせて生成
            setDisplayName(getDisplayName(currentUser, profileResult.profile))
            console.log("✅ User profile set:", profileResult.profile.id)
          } else {
            console.warn("⚠️ User profile (avatar_url) not found or error in fetchUserAndProfile:", profileResult.error)
            setUserProfile(null)
            setDisplayName(getDisplayName(currentUser, null)) // userProfileがnullの場合もdisplayNameを計算
          }
        } else {
          setUserProfile(null)
          setDisplayName("ゲスト")
          console.log("ℹ️ No current user, userProfile cleared.")
        }
      }
    } catch (err) {
      console.error("❌ Unexpected error in fetchUserAndProfile:", err)
      setUser(null)
      setUserProfile(null)
      setDisplayName("ゲスト")
    } finally {
      setLoading(false)
      console.log("✅ fetchUserAndProfile finished. Loading:", false)
    }
  }, [supabase]) // supabase を依存配列に追加

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
      setUser(null)
      setUserProfile(null)
      setDisplayName("ゲスト")
      setLoading(false)
      window.location.href = "/"
    } catch (error) {
      console.error("❌ Error during signOut process:", error)
      setLoading(false)
    }
  }, [supabase])

  const refreshUserProfile = useCallback(async () => {
    if (user?.id) {
      await fetchUserAndProfile() // userProfileだけでなく、userも再フェッチ
    }
  }, [user, fetchUserAndProfile])

  useEffect(() => {
    fetchUserAndProfile()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔄 Auth state change detected:", event, session?.user ? "logged in" : "logged out")
      if (event === "SIGNED_OUT") {
        console.log("👋 SIGNED_OUT event received. Clearing user state and redirecting.")
        setUser(null)
        setUserProfile(null)
        setDisplayName("ゲスト")
        setLoading(false)
        window.location.href = "/"
        return
      }
      fetchUserAndProfile()
    })

    return () => {
      console.log("🧹 Cleaning up auth subscription")
      subscription.unsubscribe()
    }
  }, [supabase.auth, fetchUserAndProfile])

  useEffect(() => {
    console.log("🔍 Auth Context State (Render):", {
      user: user ? { id: user.id, email: user.email } : null,
      userProfile,
      loading,
      displayName,
    })
  }, [user, userProfile, loading, displayName])

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, displayName, signOut, refreshUserProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
