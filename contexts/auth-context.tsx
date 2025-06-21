"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

interface UserProfile {
  id: string
  email: string
  user_name: string | null
  avatar_url: string | null
}

interface AuthContextType {
  user: User | null
  userProfile: UserProfile | null
  loading: boolean
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createBrowserClient()

  // ユーザープロフィールを取得する関数
  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, email, user_name, avatar_url")
        .eq("id", userId)
        .single()

      if (error) {
        console.error("Error fetching user profile:", error)
        setUserProfile(null)
      } else {
        setUserProfile(data)
        console.log("✅ User profile loaded:", data)
      }
    } catch (error) {
      console.error("Error in fetchUserProfile:", error)
      setUserProfile(null)
    }
  }

  // ユーザー情報を更新する関数
  const refreshUser = async () => {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()

      if (error) {
        console.error("Auth session error:", error)
        setUser(null)
        setUserProfile(null)
      } else {
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchUserProfile(session.user.id)
        } else {
          setUserProfile(null)
        }
        console.log("🔐 Auth state updated:", session?.user ? "logged in" : "logged out")
      }
    } catch (error) {
      console.error("Error refreshing user:", error)
      setUser(null)
      setUserProfile(null)
    }
  }

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
          setUser(session?.user ?? null)
          if (session?.user) {
            await fetchUserProfile(session.user.id)
          }
          console.log("✅ Initial session loaded:", session?.user ? "logged in" : "logged out")
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
      setUser(session?.user ?? null)

      if (session?.user) {
        await fetchUserProfile(session.user.id)
      } else {
        setUserProfile(null)
      }

      setLoading(false)
    })

    return () => {
      console.log("🧹 Cleaning up auth subscription")
      subscription.unsubscribe()
    }
  }, [supabase.auth])

  const signOut = async () => {
    try {
      console.log("👋 Signing out...")
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error("Sign out error:", error)
      } else {
        console.log("✅ Signed out successfully")
        setUserProfile(null)
      }
    } catch (error) {
      console.error("Error during sign out:", error)
    }
  }

  const value = {
    user,
    userProfile,
    loading,
    signOut,
    refreshUser,
  }

  // デバッグ情報をコンソールに出力
  useEffect(() => {
    console.log("🔍 Auth Context State:", {
      user: user ? { id: user.id, email: user.email } : null,
      userProfile,
      loading,
    })
  }, [user, userProfile, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
