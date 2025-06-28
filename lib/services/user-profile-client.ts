import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

export interface UserUpdateResult {
  success: boolean
  error?: string
}

export async function updateUserPokepokeId(user: User, pokepokeId: string): Promise<UserUpdateResult> {
  console.log("🔄 Updating pokepoke_id:", pokepokeId, "for user:", user.id)

  try {
    const supabase = createClient()

    // 既存のレコードを確認
    const { data: existingUser, error: fetchError } = await supabase
      .from("users")
      .select("id, name, email, display_name, pokepoke_id, avatar_url, is_admin")
      .eq("id", user.id)
      .maybeSingle()

    console.log("📋 Existing user data:", existingUser)

    if (fetchError) {
      console.error("❌ Error fetching existing user:", fetchError)
      return { success: false, error: `データ取得エラー: ${fetchError.message}` }
    }

    let result
    if (existingUser) {
      // 既存レコードを更新
      console.log("🔄 Updating existing user record")
      result = await supabase
        .from("users")
        .update({
          pokepoke_id: pokepokeId,
        })
        .eq("id", user.id)
        .select("id, name, email, display_name, pokepoke_id, avatar_url, is_admin")
    } else {
      // 新しいレコードを挿入
      console.log("🔄 Inserting new user record")
      result = await supabase
        .from("users")
        .insert({
          id: user.id,
          name: user.user_metadata?.full_name || user.user_metadata?.name || null,
          email: user.email || null,
          pokepoke_id: pokepokeId,
          display_name: null,
          avatar_url: user.user_metadata?.avatar_url || null,
          is_admin: false,
        })
        .select("id, name, email, display_name, pokepoke_id, avatar_url, is_admin")
    }

    const { data, error } = result

    if (error) {
      console.error("❌ Database operation error:", error)
      return { success: false, error: `データベースエラー: ${error.message}` }
    }

    console.log("✅ Database operation successful:", data)
    return { success: true }
  } catch (error) {
    console.error("❌ Unexpected error:", error)
    return { success: false, error: "予期しないエラーが発生しました。" }
  }
}

export async function updateUserDisplayName(user: User, displayName: string): Promise<UserUpdateResult> {
  console.log("🔄 Updating display_name:", displayName, "for user:", user.id)

  try {
    const supabase = createClient()

    // 既存のレコードを確認
    const { data: existingUser, error: fetchError } = await supabase
      .from("users")
      .select("id, name, email, display_name, pokepoke_id, avatar_url, is_admin")
      .eq("id", user.id)
      .maybeSingle()

    console.log("📋 Existing user data:", existingUser)

    if (fetchError) {
      console.error("❌ Error fetching existing user:", fetchError)
      return { success: false, error: `データ取得エラー: ${fetchError.message}` }
    }

    let result
    if (existingUser) {
      // 既存レコードを更新
      console.log("🔄 Updating existing user record")
      result = await supabase
        .from("users")
        .update({
          display_name: displayName,
        })
        .eq("id", user.id)
        .select("id, name, email, display_name, pokepoke_id, avatar_url, is_admin")
    } else {
      // 新しいレコードを挿入
      console.log("🔄 Inserting new user record")
      result = await supabase
        .from("users")
        .insert({
          id: user.id,
          name: user.user_metadata?.full_name || user.user_metadata?.name || null,
          email: user.email || null,
          display_name: displayName,
          pokepoke_id: null,
          avatar_url: user.user_metadata?.avatar_url || null,
          is_admin: false,
        })
        .select("id, name, email, display_name, pokepoke_id, avatar_url, is_admin")
    }

    const { data, error } = result

    if (error) {
      console.error("❌ Database operation error:", error)
      return { success: false, error: `データベースエラー: ${error.message}` }
    }

    console.log("✅ Database operation successful:", data)
    return { success: true }
  } catch (error) {
    console.error("❌ Unexpected error:", error)
    return { success: false, error: "予期しないエラーが発生しました。" }
  }
}
