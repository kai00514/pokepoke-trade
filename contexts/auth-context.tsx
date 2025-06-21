"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

interface AuthContextType {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createBrowserClient()

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
      } else {
        setUser(session?.user ?? null)
        console.log("🔐 Auth state updated:", session?.user ? "logged in" : "logged out")
      }
    } catch (error) {
      console.error("Error refreshing user:", error)
      setUser(null)
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
        } else {
          setUser(session?.user ?? null)
          console.log("✅ Initial session loaded:", session?.user ? "logged in" : "logged out")
        }
      } catch (error) {
        console.error("Error getting initial session:", error)
        setUser(null)
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
      }
    } catch (error) {
      console.error("Error during sign out:", error)
    }
  }

  const value = {
    user,
    loading,
    signOut,
    refreshUser,
  }

  // デバッグ情報をコンソールに出力
  useEffect(() => {
    console.log("🔍 Auth Context State:", {
      user: user ? { id: user.id, email: user.email } : null,
      loading,
    })
  }, [user, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
