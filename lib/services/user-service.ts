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

export async function saveUserData(
  userId: string,
  data: { pokepoke_id?: string; display_name?: string },
): Promise<UserServiceResult> {
  try {
    console.log("🔄 Saving user data for:", userId, "Data:", data)

    const supabase = createClient()

    // 現在の認証ユーザー情報を取得
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()

    if (!authUser) {
      console.error("❌ No authenticated user found")
      return { success: false, error: "認証されたユーザーが見つかりません" }
    }

    console.log("✅ Authenticated user:", authUser.id, authUser.email)

    // UPSERT操作を使用（存在しない場合は挿入、存在する場合は更新）
    const upsertData = {
      id: userId,
      name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || null,
      email: authUser.email || null,
      avatar_url: authUser.user_metadata?.avatar_url || null,
      is_admin: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...data, // pokepoke_id や display_name を上書き
    }

    console.log("📝 Upsert data:", upsertData)

    const { data: result, error } = await supabase
      .from("users")
      .upsert(upsertData, {
        onConflict: "id",
        ignoreDuplicates: false,
      })
      .select("*")
      .single()

    if (error) {
      console.error("❌ Database upsert error:", error)
      return { success: false, error: error.message }
    }

    console.log("✅ User data saved successfully:", result)
    return { success: true, profile: result }
  } catch (e) {
    console.error("❌ Unexpected error in saveUserData:", e)
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
