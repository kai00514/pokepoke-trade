import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js" // User型をインポート

export interface UserProfile {
  id: string
  avatar_url: string | null
  // user_name はこのサービスでは直接取得せず、AuthContextでuser.user_metadataから派生させる
}

export interface GetUserProfileResult {
  success: boolean
  profile: UserProfile | null
  error: string | null
}

export async function getUserProfile(userId: string): Promise<GetUserUserProfileResult> {
  const supabase = createClient()

  try {
    // auth.users テーブルから id と avatar_url のみを取得
    // raw_user_meta_data は user.user_metadata としてAuthContextで利用可能
    const { data, error } = await supabase
      .from("users") // これは auth.users テーブルを指す
      .select("id, avatar_url") // ここが重要: user_name や raw_user_meta_data を直接クエリしない
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

    // 取得したデータでUserProfileを構築
    const profile: UserProfile = {
      id: data.id,
      avatar_url: data.avatar_url,
    }

    return { success: true, profile, error: null }
  } catch (e) {
    console.error("Unexpected error in getUserProfile:", e)
    return { success: false, profile: null, error: (e as Error).message }
  }
}

// ユーザーの表示名を取得するヘルパー関数
// この関数はAuthContext内で使用され、user.user_metadataから名前を抽出します
export function getDisplayName(user: User | null, userProfile: UserProfile | null): string {
  if (!user) return "ゲスト"

  // user.user_metadata (raw_user_meta_dataに相当) からdisplay_nameまたはfull_nameを優先
  if (user.user_metadata?.display_name) {
    return user.user_metadata.display_name as string
  }
  if (user.user_metadata?.full_name) {
    return user.user_metadata.full_name as string
  }
  if (user.user_metadata?.name) {
    // Googleプロバイダーの場合 'name' がある
    return user.user_metadata.name as string
  }

  // メールアドレスの@より前をフォールバック
  return user.email?.split("@")[0] || "匿名ユーザー"
}
