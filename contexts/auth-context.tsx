"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"
import { getUserProfile, getDisplayName, type UserProfile } from "@/lib/services/user-service"

interface AuthContextType {
  user: User | null
  userProfile: UserProfile | null
  loading: boolean
  displayName: string
  signOut: () => Promise<void>
  refreshUserProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
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

      console.log(
        "📋 Session data:",
        session ? "exists" : "null",
        sessionError ? `error: ${sessionError.message}` : "no error",
      )

      if (sessionError) {
        console.error("❌ Error getting session in fetchUserAndProfile:", sessionError)
        setUser(null)
        setUserProfile(null)
        setDisplayName("ゲスト")
        return
      }

      const currentUser = session?.user ?? null
      console.log("👤 Current user:", currentUser ? `${currentUser.id} (${currentUser.email})` : "null")

      setUser(currentUser)

      if (currentUser) {
        // getUserProfileからプロフィール情報を取得
        const profileResult = await getUserProfile(currentUser.id)
        console.log("📋 Profile result:", profileResult)

        if (profileResult.success && profileResult.profile) {
          setUserProfile(profileResult.profile)
          setDisplayName(getDisplayName(currentUser, profileResult.profile))
          console.log("✅ User profile set:", profileResult.profile)
        } else {
          console.warn("⚠️ User profile not found or error:", profileResult.error)
          setUserProfile(null)
          setDisplayName(getDisplayName(currentUser, null))
        }
      } else {
        setUserProfile(null)
        setDisplayName("ゲスト")
        console.log("ℹ️ No current user, userProfile cleared.")
      }
    } catch (err) {
      console.error("❌ Unexpected error in fetchUserAndProfile:", err)
      setUser(null)
      setUserProfile(null)
      setDisplayName("ゲスト")
    } finally {
      setLoading(false)
      console.log("✅ fetchUserAndProfile finished. Loading set to false")
    }
  }, [supabase])

  const signOut = useCallback(async () => {
    console.log("👋 Attempting to sign out...")
    setLoading(true)
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error("❌ Supabase signOut error:", error)
        throw error
      }
      console.log("✅ Supabase signOut successful")
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
      console.log("🔄 Refreshing user profile for:", user.id)
      await fetchUserAndProfile()
    }
  }, [user, fetchUserAndProfile])

  useEffect(() => {
    console.log("🚀 AuthProvider useEffect - Initial setup")
    fetchUserAndProfile()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(
        "🔄 Auth state change detected:",
        event,
        session?.user ? `logged in as ${session.user.email}` : "logged out",
      )

      if (event === "SIGNED_OUT") {
        console.log("👋 SIGNED_OUT event received. Clearing user state")
        setUser(null)
        setUserProfile(null)
        setDisplayName("ゲスト")
        setLoading(false)
        return
      }

      // その他のイベントでは再フェッチ
      await fetchUserAndProfile()
    })

    return () => {
      console.log("🧹 Cleaning up auth subscription")
      subscription.unsubscribe()
    }
  }, [supabase.auth, fetchUserAndProfile])

  // デバッグ用のログ
  useEffect(() => {
    console.log("🔍 Auth Context State Update:", {
      user: user ? { id: user.id, email: user.email } : null,
      userProfile: userProfile ? { id: userProfile.id, user_name: userProfile.user_name } : null,
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
