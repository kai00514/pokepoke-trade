"use client"

import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function AuthDebug() {
  const { user, userProfile, loading, displayName } = useAuth()

  return (
    <Card className="m-4 max-w-md">
      <CardHeader>
        <CardTitle className="text-sm">認証デバッグ情報</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-xs">
        <div>
          <strong>Loading:</strong> {loading ? "true" : "false"}
        </div>
        <div>
          <strong>User:</strong> {user ? `${user.email} (${user.id})` : "null"}
        </div>
        <div>
          <strong>UserProfile:</strong>{" "}
          {userProfile ? `${userProfile.user_name || "no name"} (${userProfile.id})` : "null"}
        </div>
        <div>
          <strong>DisplayName:</strong> {displayName}
        </div>
        <div>
          <strong>User Metadata:</strong> {user ? JSON.stringify(user.user_metadata, null, 2) : "null"}
        </div>
      </CardContent>
    </Card>
  )
}
