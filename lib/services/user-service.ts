import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

export interface UserProfile {
  id: string
  user_name: string | null
  pokepoke_id: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const supabase = createClient()

    // 管理者APIではなく、通常のクエリを使用
    const { data, error } = await supabase.from("users").select("*").eq("id", userId).single()

    if (error) {
      console.error("Error fetching user profile:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Unexpected error fetching user profile:", error)
    return null
  }
}

export function getDisplayName(user: User | null, profile: UserProfile | null): string {
  if (profile?.user_name) {
    return profile.user_name
  }
  if (user?.user_metadata?.full_name) {
    return user.user_metadata.full_name
  }
  if (user?.email) {
    return user.email.split("@")[0]
  }
  return "ユーザー"
}
