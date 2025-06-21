import { createClient } from "@/lib/supabase/client" // クライアントサイドクライアントを使用

interface UserProfile {
  id: string
  user_name: string | null
  avatar_url: string | null
}

interface GetUserProfileResult {
  success: boolean
  profile: UserProfile | null
  error: string | null
}

export async function getUserProfile(userId: string): Promise<GetUserUserProfileResult> {
  const supabase = createClient() // クライアントサイドクライアントを使用

  try {
    const { data, error } = await supabase.from("users").select("id, user_name, avatar_url").eq("id", userId).single()

    if (error) {
      console.error("Error fetching user profile from DB:", error)
      return { success: false, profile: null, error: error.message }
    }

    if (!data) {
      console.warn(`User profile not found for ID: ${userId}`)
      return { success: false, profile: null, error: "User profile not found" }
    }

    return { success: true, profile: data, error: null }
  } catch (e) {
    console.error("Unexpected error in getUserProfile:", e)
    return { success: false, profile: null, error: (e as Error).message }
  }
}
