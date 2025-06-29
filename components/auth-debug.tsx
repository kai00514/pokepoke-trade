"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function AuthDebug() {
  const [authState, setAuthState] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createBrowserClient()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        setAuthState({
          hasSession: !!session,
          hasUser: !!session?.user,
          userId: session?.user?.id || null,
          userEmail: session?.user?.email || null,
          userMetadata: session?.user?.user_metadata || null,
          error: error?.message || null,
          timestamp: new Date().toISOString(),
        })
      } catch (err) {
        setAuthState({
          error: err instanceof Error ? err.message : "Unknown error",
          timestamp: new Date().toISOString(),
        })
      } finally {
        setLoading(false)
      }
    }

    checkAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("[AuthDebug] Auth state changed:", event, session?.user?.id)
      checkAuth()
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  if (loading) {
    return <div>認証状態を確認中...</div>
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>認証状態デバッグ</CardTitle>
      </CardHeader>
      <CardContent>
        <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">{JSON.stringify(authState, null, 2)}</pre>
      </CardContent>
    </Card>
  )
}
