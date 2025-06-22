"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"
import { getUserProfile, type UserProfile, getDisplayName } from "@/lib/services/user-service"

interface AuthContextType {
  user: User | null
  userProfile: UserProfile | null
  loading: boolean
  displayName: string
  refreshUserProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [displayName, setDisplayName] = useState<string>("ゲスト")

  const supabase = createClient()

  const fetchUserProfile = useCallback(
    async (userId: string) => {
      const { success, profile } = await getUserProfile(userId)
      if (success) {
        setUserProfile(profile)
        setDisplayName(getDisplayName(user, profile)) // userProfileが更新されたらdisplayNameも更新
      } else {
        setUserProfile(null)
        setDisplayName(getDisplayName(user, null))
      }
    },
    [user],
  ) // userが変更されたらfetchUserProfileも再生成

  const refreshUserProfile = useCallback(async () => {
    if (user?.id) {
      await fetchUserProfile(user.id)
    }
  }, [user, fetchUserProfile])

  useEffect(() => {
    const getSession = async () => {
      console.log("🚀 Getting initial auth session...")
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()

      if (error) {
        console.error("Error getting session:", error)
      }

      setUser(session?.user || null)
      if (session?.user) {
        console.log("🔄 Auth state change: SIGNED_IN logged in")
        await fetchUserProfile(session.user.id)
      } else {
        console.log("🔄 Auth state change: SIGNED_OUT logged out")
        setUserProfile(null)
        setDisplayName("ゲスト")
      }
      setLoading(false)
      console.log("✅ Initial session loaded:", session?.user ? "logged in" : "logged out")
    }

    getSession()

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔄 Auth state change:", event, session?.user ? "logged in" : "logged out")
      setUser(session?.user || null)
      if (session?.user) {
        await fetchUserProfile(session.user.id)
      } else {
        setUserProfile(null)
        setDisplayName("ゲスト")
      }
      setLoading(false)
    })

    return () => {
      authListener?.unsubscribe()
    }
  }, [supabase, fetchUserProfile, user]) // userを依存配列に追加

  // userまたはuserProfileが変更されたらdisplayNameを再計算
  useEffect(() => {
    setDisplayName(getDisplayName(user, userProfile))
  }, [user, userProfile])

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, displayName, refreshUserProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
