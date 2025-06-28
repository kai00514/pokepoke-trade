"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"
import { getUserProfile, type UserProfile } from "@/lib/services/user-service"

interface AuthContextType {
  user: User | null
  userProfile: UserProfile | null
  loading: boolean
  signOut: () => Promise<void>
  refreshUserProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchUserProfile = async (userId: string) => {
    console.log("🔄 Fetching user profile for:", userId)
    const result = await getUserProfile(userId)
    if (result.success) {
      console.log("✅ User profile fetched:", result.profile)
      setUserProfile(result.profile || null)
    } else {
      console.log("❌ Failed to fetch user profile:", result.error)
      setUserProfile(null)
    }
  }

  const refreshUserProfile = async () => {
    if (user) {
      console.log("🔄 Refreshing user profile for:", user.id)
      await fetchUserProfile(user.id)
    }
  }

  useEffect(() => {
    // 初期認証状態を取得
    const getInitialSession = async () => {
      console.log("🔄 Getting initial session...")
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()

      if (error) {
        console.error("❌ Error getting session:", error)
      } else if (session?.user) {
        console.log("✅ Initial session found:", session.user.id)
        setUser(session.user)
        await fetchUserProfile(session.user.id)
      } else {
        console.log("ℹ️ No initial session found")
      }
      setLoading(false)
    }

    getInitialSession()

    // 認証状態の変更を監視
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔄 Auth state changed:", event, session?.user?.id)

      if (session?.user) {
        setUser(session.user)
        await fetchUserProfile(session.user.id)
      } else {
        setUser(null)
        setUserProfile(null)
      }
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  const signOut = async () => {
    console.log("🔄 Signing out...")
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error("❌ Sign out error:", error)
      throw error
    }
    console.log("✅ Signed out successfully")
    setUser(null)
    setUserProfile(null)
  }

  const value = {
    user,
    userProfile,
    loading,
    signOut,
    refreshUserProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
