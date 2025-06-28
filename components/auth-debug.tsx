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
      <CardContent className="text-xs space-y-2">
        <div>
          <strong>Loading:</strong> {loading ? "true" : "false"}
        </div>
        <div>
          <strong>User:</strong> {user ? `${user.id} (${user.email})` : "null"}
        </div>
        <div>
          <strong>UserProfile:</strong> {userProfile ? `${userProfile.id} (${userProfile.user_name})` : "null"}
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
