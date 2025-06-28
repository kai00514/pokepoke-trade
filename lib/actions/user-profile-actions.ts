"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export interface ActionResult {
  success: boolean
  error?: string
  data?: any
}

export async function updatePokepokeId(pokepokeId: string): Promise<ActionResult> {
  try {
    console.log("🔄 Starting updatePokepokeId with value:", pokepokeId)

    const supabase = await createServerClient()

    // 現在のユーザーを取得
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      console.error("❌ Auth error:", authError)
      return { success: false, error: `認証エラー: ${authError.message}` }
    }

    if (!user) {
      console.error("❌ No user found")
      return { success: false, error: "ユーザーが見つかりません" }
    }

    console.log("✅ User authenticated:", user.id)

    // まず既存のレコードを確認
    const { data: existingUser, error: fetchError } = await supabase
      .from("users")
      .select("id, name, email, display_name, pokepoke_id, avatar_url, is_admin")
      .eq("id", user.id)
      .maybeSingle()

    console.log("📋 Existing user data:", existingUser)
    console.log("📋 Fetch error:", fetchError)

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

    // キャッシュを再検証
    revalidatePath("/")
    revalidatePath("/trades/create")

    return { success: true, data }
  } catch (e) {
    console.error("❌ Unexpected error in updatePokepokeId:", e)
    return { success: false, error: `予期しないエラー: ${(e as Error).message}` }
  }
}

export async function updateDisplayName(displayName: string): Promise<ActionResult> {
  try {
    console.log("🔄 Starting updateDisplayName with value:", displayName)

    const supabase = await createServerClient()

    // 現在のユーザーを取得
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      console.error("❌ Auth error:", authError)
      return { success: false, error: `認証エラー: ${authError.message}` }
    }

    if (!user) {
      console.error("❌ No user found")
      return { success: false, error: "ユーザーが見つかりません" }
    }

    console.log("✅ User authenticated:", user.id)

    // まず既存のレコードを確認
    const { data: existingUser, error: fetchError } = await supabase
      .from("users")
      .select("id, name, email, display_name, pokepoke_id, avatar_url, is_admin")
      .eq("id", user.id)
      .maybeSingle()

    console.log("📋 Existing user data:", existingUser)
    console.log("📋 Fetch error:", fetchError)

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

    // キャッシュを再検証
    revalidatePath("/")

    return { success: true, data }
  } catch (e) {
    console.error("❌ Unexpected error in updateDisplayName:", e)
    return { success: false, error: `予期しないエラー: ${(e as Error).message}` }
  }
}
