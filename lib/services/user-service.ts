import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

export interface UserProfile {
  id: string
  user_name: string | null
  pokepoke_id: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

// 自分のプロフィール情報を取得（管理者APIは使用しない）
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const supabase = createClient()

    // 通常のクエリを使用（RLSにより自分の情報のみアクセス可能）
    const { data, error } = await supabase
      .from("users")
      .select("id, user_name, pokepoke_id, avatar_url, created_at, updated_at")
      .eq("id", userId)
      .single()

    if (error) {
      console.error("Error fetching user profile:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Unexpected error fetching user profile:", error)
    return null
  }
}

// 自分のユーザー名を更新
export async function updateUserName(userId: string, userName: string): Promise<boolean> {
  try {
    const supabase = createClient()

    const { error } = await supabase
      .from("users")
      .update({
        user_name: userName,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    if (error) {
      console.error("Error updating user name:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Unexpected error updating user name:", error)
    return false
  }
}

// 自分のポケポケIDを更新
export async function updatePokepokeId(userId: string, pokepokeId: string): Promise<boolean> {
  try {
    const supabase = createClient()

    const { error } = await supabase
      .from("users")
      .update({
        pokepoke_id: pokepokeId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    if (error) {
      console.error("Error updating pokepoke ID:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Unexpected error updating pokepoke ID:", error)
    return false
  }
}

// 表示名を取得（管理者APIは使用しない）
export function getDisplayName(user: User | null, profile: UserProfile | null): string {
  if (profile?.user_name) {
    return profile.user_name
  }
  if (user?.user_metadata?.full_name) {
    return user.user_metadata.full_name
  }
  if (user?.email) {
    return user.email.split("@")[0]
  }
  return "ユーザー"
}
