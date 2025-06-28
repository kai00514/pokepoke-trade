import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

export interface UserProfile {
  id: string
  avatar_url: string | null
  display_name: string | null
  pokepoke_id: string | null
  created_at?: string
  updated_at?: string
}

export interface GetUserProfileResult {
  success: boolean
  profile: UserProfile | null
  error: string | null
}

export async function getUserProfile(userId: string): Promise<GetUserProfileResult> {
  const supabase = createClient()

  try {
    console.log("🔄 Fetching user profile from database for user:", userId)

    const { data, error } = await supabase
      .from("users")
      .select("id, avatar_url, display_name, pokepoke_id, created_at, updated_at")
      .eq("id", userId)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        // レコードが見つからない場合は、新しいレコードを作成
        console.log("ℹ️ User profile not found, creating new record...")
        const { data: newData, error: insertError } = await supabase
          .from("users")
          .insert({
            id: userId,
            avatar_url: null,
            display_name: null,
            pokepoke_id: null,
          })
          .select()
          .single()

        if (insertError) {
          console.error("❌ Error creating user profile:", insertError)
          return { success: false, profile: null, error: insertError.message }
        }

        console.log("✅ Created new user profile:", newData)
        return { success: true, profile: newData, error: null }
      } else {
        console.error("❌ Error fetching user profile:", error)
        return { success: false, profile: null, error: error.message }
      }
    }

    console.log("✅ User profile fetched successfully:", data)
    return { success: true, profile: data, error: null }
  } catch (e) {
    console.error("❌ Unexpected error in getUserProfile:", e)
    return { success: false, profile: null, error: (e as Error).message }
  }
}

export function getDisplayName(user: User | null, userProfile: UserProfile | null): string {
  if (!user) return "ゲスト"

  // 優先順位: userProfile.display_name > user.user_metadata.display_name > user.email
  if (userProfile?.display_name) {
    return userProfile.display_name
  }

  if (user.user_metadata?.display_name) {
    return user.user_metadata.display_name as string
  }

  if (user.user_metadata?.full_name) {
    return user.user_metadata.full_name as string
  }

  if (user.user_metadata?.name) {
    return user.user_metadata.name as string
  }

  return user.email?.split("@")[0] || "匿名ユーザー"
}
