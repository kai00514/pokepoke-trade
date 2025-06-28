import { createClient } from "@/lib/supabase/client"

export interface UserProfile {
  id: string
  avatar_url: string | null
  display_name: string | null
  pokepoke_id: string | null
}

export interface UserProfileResult {
  success: boolean
  profile?: UserProfile
  error?: string
}

export async function getUserProfile(userId: string): Promise<UserProfileResult> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("users")
      .select("id, avatar_url, display_name, pokepoke_id")
      .eq("id", userId)
      .single()

    if (error) {
      console.error("Error fetching user profile:", error)
      return { success: false, error: error.message }
    }

    return { success: true, profile: data }
  } catch (e) {
    console.error("Unexpected error in getUserProfile:", e)
    return { success: false, error: (e as Error).message }
  }
}

export function getDisplayName(user: any, userProfile: UserProfile | null): string {
  // 優先順位: userProfile.display_name > user.user_metadata.display_name > user.email
  if (userProfile?.display_name) {
    return userProfile.display_name
  }

  if (user?.user_metadata?.display_name) {
    return user.user_metadata.display_name
  }

  if (user?.email) {
    return user.email.split("@")[0]
  }

  return "ユーザー"
}
