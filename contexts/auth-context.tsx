"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
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
  const [isInitialized, setIsInitialized] = useState(false)

  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()

  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      console.log("🔍 Fetching user profile for:", userId)
      const profile = await getUserProfile(userId)
      setUserProfile(profile)

      // 表示名の優先順位: display_name > pokepoke_id > email
      const currentUser = await supabase.auth.getUser()
      const email = currentUser.data.user?.email
      const name = profile?.display_name || profile?.pokepoke_id || email?.split("@")[0] || "ユーザー"
      setDisplayName(name)

      console.log("👤 User profile loaded:", { profile, displayName: name })
    } catch (error) {
      console.error("❌ Error fetching user profile:", error)
      // プロファイル取得に失敗してもユーザーのメールアドレスから表示名を設定
      const currentUser = await supabase.auth.getUser()
      const email = currentUser.data.user?.email
      setDisplayName(email?.split("@")[0] || "ユーザー")
    }
  }, [supabase.auth])

  const initializeAuth = useCallback(async () => {
    try {
      console.log("🚀 Initializing auth...")
      
      // 1. 現在のセッションを取得
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error("❌ Session error:", sessionError)
        setUser(null)
        setUserProfile(null)
        setDisplayName("")
        setLoading(false)
        return
      }

      if (session?.user) {
        console.log("✅ Session found:", session.user.email)
        setUser(session.user)
        await fetchUserProfile(session.user.id)
      } else {
        console.log("ℹ️ No session found")
        setUser(null)
        setUserProfile(null)
        setDisplayName("")
      }

      setLoading(false)
      setIsInitialized(true)
    } catch (error) {
      console.error("❌ Error initializing auth:", error)
      setUser(null)
      setUserProfile(null)
      setDisplayName("")
      setLoading(false)
      setIsInitialized(true)
    }
  }, [supabase.auth, fetchUserProfile])

  useEffect(() => {
    // 初期化を実行
    initializeAuth()

    // 認証状態変更の監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔄 Auth state changed:", event, session?.user?.email || "no user")

      if (event === 'SIGNED_IN' && session?.user) {
        console.log("✅ User signed in:", session.user.email)
        setUser(session.user)
        await fetchUserProfile(session.user.id)
        setLoading(false)
      } else if (event === 'SIGNED_OUT') {
        console.log("🚪 User signed out")
        setUser(null)
        setUserProfile(null)
        setDisplayName("")
        setLoading(false)
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        console.log("🔄 Token refreshed for:", session.user.email)
        setUser(session.user)
        await fetchUserProfile(session.user.id)
        setLoading(false)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [initializeAuth, fetchUserProfile, supabase.auth])

  // URLパラメータのcodeを処理（初期化後）
  useEffect(() => {
    if (!isInitialized) return

    const handleCodeParameter = async () => {
      const code = searchParams.get("code")
      if (code) {
        console.log("🔐 Processing code parameter:", code)
        try {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) {
            console.error("❌ Code exchange error:", error)
          } else if (data.session) {
            console.log("✅ Code exchanged successfully for user:", data.session.user.email)
            setUser(data.session.user)
            await fetchUserProfile(data.session.user.id)
            setLoading(false)
            
            // URLからcodeパラメータを削除
            const url = new URL(window.location.href)
            url.searchParams.delete("code")
            window.history.replaceState({}, "", url.toString())
          }
        } catch (error) {
          console.error("❌ Error processing code:", error)
        }
      }
    }

    handleCodeParameter()
  }, [searchParams, isInitialized, supabase.auth, fetchUserProfile])

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
