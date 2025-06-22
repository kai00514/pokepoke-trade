import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

export interface UserProfile {
  id: string
  // user_name: string | null // user_nameはauth.usersに存在しないため削除
  avatar_url: string | null
  // raw_user_meta_dataから取得するため、直接のプロパティとしては持たない
  raw_user_meta_data: {
    display_name?: string
    full_name?: string
    // その他のメタデータ
    [key: string]: any
  } | null
}

export interface GetUserUserProfileResult {
  success: boolean
  profile: UserProfile | null
  error: string | null
}

export async function getUserProfile(userId: string): Promise<GetUserUserProfileResult> {
  const supabase = createClient()

  try {
    // user_nameの代わりにraw_user_meta_dataを取得
    const { data, error } = await supabase
      .from("users") // auth.usersテーブルを指す
      .select("id, raw_user_meta_data, avatar_url")
      .eq("id", userId)
      .single()

    if (error) {
      console.error("Error fetching user profile from DB:", error)
      return { success: false, profile: null, error: error.message }
    }

    if (!data) {
      console.warn(`User profile not found for ID: ${userId}`)
      return { success: false, profile: null, error: "User profile not found" }
    }

    // raw_user_meta_dataを直接返す
    return { success: true, profile: data as UserProfile, error: null }
  } catch (e) {
    console.error("Unexpected error in getUserProfile:", e)
    return { success: false, profile: null, error: (e as Error).message }
  }
}

// ユーザーの表示名を取得するヘルパー関数
export function getDisplayName(user: User | null, userProfile: UserProfile | null): string {
  if (!user) return "ゲスト"

  // userProfileからdisplay_nameまたはfull_nameを優先
  if (userProfile?.raw_user_meta_data?.display_name) {
    return userProfile.raw_user_meta_data.display_name
  }
  if (userProfile?.raw_user_meta_data?.full_name) {
    return userProfile.raw_user_meta_data.full_name
  }

  // user.user_metadataからdisplay_nameまたはfull_nameを試す (古い形式のメタデータ対応)
  if (user.user_metadata?.display_name) {
    return user.user_metadata.display_name
  }
  if (user.user_metadata?.full_name) {
    return user.user_metadata.full_name
  }

  // メールアドレスの@より前をフォールバック
  return user.email?.split("@")[0] || "匿名ユーザー"
}
