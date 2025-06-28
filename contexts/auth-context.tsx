"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client" // ここはclient.tsからcreateClientをインポート
import type { User } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"

interface AuthContextType {
  user: User | null
  signOut: () => Promise<void>
  signInWithOAuth: (provider: "google" | "twitter" | "line") => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const supabase = createClient()
  const router = useRouter()

  const fetchUser = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    setUser(user)
  }, [supabase])

  useEffect(() => {
    fetchUser()

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
        setUser(session?.user || null)
        router.refresh() // サーバーサイドセッションを更新するためにページをリフレッシュ
      }
    })

    return () => {
      authListener?.unsubscribe()
    }
  }, [fetchUser, supabase.auth, router])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setUser(null)
    router.refresh()
  }, [supabase.auth, router])

  const signInWithOAuth = useCallback(
    async (provider: "google" | "twitter" | "line") => {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${location.origin}/auth/callback`,
        },
      })
      // エラーハンドリングの改善は不要なので、エラーログのみ
      if (error) {
        console.error("OAuth sign in error:", error.message)
      }
    },
    [supabase.auth],
  )

  return <AuthContext.Provider value={{ user, signOut, signInWithOAuth }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
