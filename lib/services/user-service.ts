import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

export interface UserProfile {
  id: string
  avatar_url: string | null
  user_name?: string | null
  pokepoke_id?: string | null
}

export async function getUserProfile(userId: string): Promise<{
  success: boolean
  profile?: UserProfile | null
  error?: string
}> {
  console.log("🔄 getUserProfile called for userId:", userId)

  try {
    const supabase = createClient()

    // まず auth.users から基本情報を取得
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      console.error("❌ Auth error in getUserProfile:", authError)
      return { success: false, error: authError.message }
    }

    if (!user || user.id !== userId) {
      console.warn("⚠️ User not found or ID mismatch in getUserProfile")
      return { success: false, error: "User not found" }
    }

    // public.users テーブルから追加情報を取得（存在する場合）
    const { data: publicUserData, error: publicUserError } = await supabase
      .from("users")
      .select("user_name, pokepoke_id")
      .eq("id", userId)
      .maybeSingle()

    if (publicUserError && publicUserError.code !== "PGRST116") {
      console.error("❌ Public user data error:", publicUserError)
      // エラーがあってもauth情報は返す
    }

    const profile: UserProfile = {
      id: user.id,
      avatar_url: user.user_metadata?.avatar_url || null,
      user_name: publicUserData?.user_name || null,
      pokepoke_id: publicUserData?.pokepoke_id || null,
    }

    console.log("✅ getUserProfile success:", profile)
    return { success: true, profile }
  } catch (error) {
    console.error("❌ Unexpected error in getUserProfile:", error)
    return { success: false, error: "Unexpected error occurred" }
  }
}

export function getDisplayName(user: User | null, userProfile: UserProfile | null): string {
  if (!user) return "ゲスト"

  // 優先順位: user_name > user_metadata.full_name > user_metadata.name > email
  if (userProfile?.user_name) {
    return userProfile.user_name
  }

  if (user.user_metadata?.full_name) {
    return user.user_metadata.full_name
  }

  if (user.user_metadata?.name) {
    return user.user_metadata.name
  }

  if (user.email) {
    return user.email.split("@")[0]
  }

  return "ユーザー"
}
