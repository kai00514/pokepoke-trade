import { createServerClient } from "@/lib/supabase/server"

export interface UserProfile {
  id: string
  email: string
  user_name: string | null
  avatar_url: string | null
  created_at: string
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const supabase = createServerClient()

    const { data, error } = await supabase
      .from("users")
      .select("id, email, user_name, avatar_url, created_at")
      .eq("id", userId)
      .single()

    if (error) {
      console.error("Error fetching user profile:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error in getUserProfile:", error)
    return null
  }
}

export async function updateUserProfile(
  userId: string,
  updates: Partial<Pick<UserProfile, "user_name" | "avatar_url">>,
) {
  try {
    const supabase = createServerClient()

    const { data, error } = await supabase.from("users").update(updates).eq("id", userId).select().single()

    if (error) {
      console.error("Error updating user profile:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Error in updateUserProfile:", error)
    return { success: false, error: "Failed to update profile" }
  }
}
