import { createServerClient } from "@/lib/supabase/server"
import type { User } from "@supabase/supabase-js"

export interface UserProfile {
  id: string
  user_name: string | null
  pokepoke_id: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const supabase = await createServerClient()

  const { data: profile, error } = await supabase
    .from("users") // 'users' はあなたの公開プロフィールテーブルを想定
    .select("id, user_name, pokepoke_id, avatar_url, created_at, updated_at")
    .eq("id", userId)
    .single()

  if (error) {
    console.error("Error fetching user profile:", error.message)
    return null
  }
  return profile
}

export async function updateUserName(userId: string, userName: string) {
  const supabase = await createServerClient()

  const { data, error } = await supabase.from("users").update({ user_name: userName }).eq("id", userId).select()

  if (error) {
    console.error("Error updating user name:", error.message)
    throw error
  }
  return data
}

export async function updatePokepokeId(userId: string, pokepokeId: string) {
  const supabase = await createServerClient()

  const { data, error } = await supabase.from("users").update({ pokepoke_id: pokepokeId }).eq("id", userId).select()

  if (error) {
    console.error("Error updating pokepoke ID:", error.message)
    throw error
  }
  return data
}

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
