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

export interface UserServiceResult {
  success: boolean
  profile?: UserProfile | null
  error?: string
}

export async function getUserProfile(userId: string): Promise<UserServiceResult> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase.from("users").select("*").eq("id", userId).single()

    if (error) {
      console.error("Error fetching user profile:", error)
      return { success: false, error: error.message }
    }

    return { success: true, profile: data }
  } catch (error) {
    console.error("Unexpected error in getUserProfile:", error)
    return { success: false, error: "Unexpected error occurred" }
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
  return "ゲスト"
}

export async function updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserServiceResult> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase.from("users").update(updates).eq("id", userId).select().single()

    if (error) {
      console.error("Error updating user profile:", error)
      return { success: false, error: error.message }
    }

    return { success: true, profile: data }
  } catch (error) {
    console.error("Unexpected error in updateUserProfile:", error)
    return { success: false, error: "Unexpected error occurred" }
  }
}
