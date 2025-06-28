"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback } from "react"
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

  const fetchUserAndProfile = useCallback(async () => {
    setLoading(true)
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()
    setUser(authUser)

    if (authUser) {
      const { success, profile } = await getUserProfile(authUser.id)
      if (success) {
        setUserProfile(profile || null)
      } else {
        setUserProfile(null)
        console.error("Failed to fetch user profile for:", authUser.id)
      }
    } else {
      setUserProfile(null)
    }
    setLoading(false)
  }, [supabase])

  const refreshUserProfile = useCallback(async () => {
    if (user) {
      const { success, profile } = await getUserProfile(user.id)
      if (success) {
        setUserProfile(profile || null)
      } else {
        console.error("Failed to refresh user profile for:", user.id)
      }
    }
  }, [user])

  useEffect(() => {
    fetchUserAndProfile()

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", event, session?.user?.id)
      setUser(session?.user || null)
      // 認証状態が変わったらプロファイルも再フェッチ
      if (session?.user) {
        fetchUserAndProfile()
      } else {
        setUserProfile(null)
      }
    })

    return () => {
      authListener.unsubscribe()
    }
  }, [supabase, fetchUserAndProfile])

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error("Sign out error:", error)
      throw error
    }
    setUser(null)
    setUserProfile(null)
  }, [supabase])

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, signOut, refreshUserProfile }}>
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
