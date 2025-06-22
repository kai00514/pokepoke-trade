import { createClient } from "@/lib/supabase/client"

interface UserProfile {
  id: string
  user_name: string | null // 計算プロパティとして維持
  avatar_url: string | null
}

interface GetUserProfileResult {
  success: boolean
  profile: UserProfile | null
  error: string | null
}

export async function getUserProfile(userId: string): Promise<GetUserProfileResult> {
  const supabase = createClient()

  try {
    // auth.users テーブルから raw_user_meta_data を取得
    const { data, error } = await supabase
      .from("users") // これは auth.users テーブルを指す
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

    // raw_user_meta_data からユーザー名を抽出
    const rawMetaData = data.raw_user_meta_data as any
    const user_name = rawMetaData?.display_name || rawMetaData?.full_name || rawMetaData?.name || null

    // 既存のインターフェースに合わせてデータを構築
    const profile: UserProfile = {
      id: data.id,
      user_name,
      avatar_url: data.avatar_url,
    }

    return { success: true, profile, error: null }
  } catch (e) {
    console.error("Unexpected error in getUserProfile:", e)
    return { success: false, profile: null, error: (e as Error).message }
  }
}
