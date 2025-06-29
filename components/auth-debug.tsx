"use client"

import { useAuth } from "@/contexts/auth-context"
import { useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// AuthDebugを名前付きエクスポートとして定義
export function AuthDebug() {
  const { user, userProfile, loading, displayName } = useAuth()

  useEffect(() => {
    console.log("🔍 AuthDebug - Current state:", {
      user: user ? { id: user.id, email: user.email } : null,
      userProfile: userProfile ? { id: userProfile.id, display_name: userProfile.display_name } : null,
      loading,
      displayName,
      timestamp: new Date().toISOString(),
    })
  }, [user, userProfile, loading, displayName])

  if (process.env.NODE_ENV !== "development") {
    return null
  }

  return (
    <Card className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg text-xs max-w-xs z-50">
      <CardHeader className="p-0 pb-2">
        <CardTitle className="text-sm">🔍 Auth Debug</CardTitle>
      </CardHeader>
      <CardContent className="p-0 space-y-1">
        <div>Loading: {loading ? "✅" : "❌"}</div>
        <div>User: {user ? "✅" : "❌"}</div>
        <div>Profile: {userProfile ? "✅" : "❌"}</div>
        <div>Display: {displayName || "なし"}</div>
        {user && <div className="mt-2 text-xs opacity-75">{user.email}</div>}
      </CardContent>
    </Card>
  )
}

// デフォルトエクスポートも維持
export default AuthDebug
