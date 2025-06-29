"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"
import { getUserProfile } from "@/lib/services/user-service"

interface UserProfile {
  id: string
  pokepoke_id?: string
  display_name?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

interface AuthContextType {
  user: User | null
  userProfile: UserProfile | null
  loading: boolean
  displayName: string
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [displayName, setDisplayName] = useState<string>("")

  const supabase = createClient()

  useEffect(() => {
    // 初期セッション取得
    const getInitialSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          console.error("❌ Error getting session:", error)
          setUser(null)
          setUserProfile(null)
          setDisplayName("")
        } else if (session?.user) {
          console.log("✅ Initial session found:", session.user.email)
          setUser(session.user)
          await fetchUserProfile(session.user.id)
        } else {
          console.log("ℹ️ No initial session found")
          setUser(null)
          setUserProfile(null)
          setDisplayName("")
        }
      } catch (error) {
        console.error("❌ Error in getInitialSession:", error)
        setUser(null)
        setUserProfile(null)
        setDisplayName("")
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // 認証状態変更の監視
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔄 Auth state changed:", event, session?.user?.email || "no user")

      if (session?.user) {
        setUser(session.user)
        await fetchUserProfile(session.user.id)
      } else {
        setUser(null)
        setUserProfile(null)
        setDisplayName("")
      }

      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const fetchUserProfile = async (userId: string) => {
    try {
      const profile = await getUserProfile(userId)
      setUserProfile(profile)

      // 表示名の優先順位: display_name > pokepoke_id > email
      const user = await supabase.auth.getUser()
      const email = user.data.user?.email
      const name = profile?.display_name || profile?.pokepoke_id || email?.split("@")[0] || "ユーザー"
      setDisplayName(name)

      console.log("👤 User profile loaded:", { profile, displayName: name })
    } catch (error) {
      console.error("❌ Error fetching user profile:", error)
      // プロファイル取得に失敗してもユーザーのメールアドレスから表示名を設定
      const user = await supabase.auth.getUser()
      const email = user.data.user?.email
      setDisplayName(email?.split("@")[0] || "ユーザー")
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error("❌ Sign out error:", error)
        throw error
      }

      setUser(null)
      setUserProfile(null)
      setDisplayName("")
      console.log("✅ Signed out successfully")
    } catch (error) {
      console.error("❌ Error during sign out:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const value = {
    user,
    userProfile,
    loading,
    displayName,
    signOut,
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
