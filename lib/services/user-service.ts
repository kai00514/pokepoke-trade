import { createClient } from "@/lib/supabase/client"

export interface UserProfile {
  id: string
  name?: string | null
  email?: string | null
  display_name?: string | null
  pokepoke_id?: string | null
  avatar_url?: string | null
  is_admin?: boolean
  created_at?: string
  updated_at?: string
}

export interface UserServiceResult {
  success: boolean
  profile?: UserProfile | null
  error?: string
}

export async function getUserProfile(userId: string): Promise<UserServiceResult> {
  try {
    console.log("🔄 Fetching user profile for:", userId)

    const supabase = createClient()

    const { data, error } = await supabase.from("users").select("*").eq("id", userId).maybeSingle()

    if (error && error.code !== "PGRST116") {
      // PGRST116 は "no rows returned" エラーなので、これは問題ない
      console.error("❌ Error fetching user profile:", error)
      return { success: false, error: error.message }
    }

    console.log("✅ User profile fetched:", data)
    return { success: true, profile: data }
  } catch (e) {
    console.error("❌ Unexpected error in getUserProfile:", e)
    return { success: false, error: (e as Error).message }
  }
}

export async function getDisplayName(userId: string): Promise<string | null> {
  try {
    const result = await getUserProfile(userId)
    if (result.success && result.profile) {
      return result.profile.display_name || result.profile.name || null
    }
    return null
  } catch (e) {
    console.error("❌ Error getting display name:", e)
    return null
  }
}
