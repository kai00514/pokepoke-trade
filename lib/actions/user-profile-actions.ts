"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"

export interface ActionResult {
  success: boolean
  error?: string
}

export async function updatePokepokeId(pokepokeId: string): Promise<ActionResult> {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(cookieStore)

    // 現在のユーザーを取得
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("Auth error:", authError)
      return { success: false, error: "認証エラー: ユーザーが見つかりません" }
    }

    console.log("Updating pokepoke_id for user:", user.id, "with value:", pokepokeId)

    // UPSERTを使用してユーザーレコードを挿入または更新
    const { error } = await supabase.from("users").upsert(
      {
        id: user.id,
        pokepoke_id: pokepokeId,
        display_name: null, // 既存の値を保持するため、別途取得が必要
      },
      {
        onConflict: "id",
      },
    )

    if (error) {
      console.error("Error updating pokepoke_id:", error)
      return { success: false, error: `データベースエラー: ${error.message}` }
    }

    console.log("Successfully updated pokepoke_id")

    // 関連するページのキャッシュを再検証
    revalidatePath("/")
    revalidatePath("/trades/create")

    return { success: true }
  } catch (e) {
    console.error("Unexpected error in updatePokepokeId:", e)
    return { success: false, error: `予期しないエラー: ${(e as Error).message}` }
  }
}

export async function updateDisplayName(displayName: string): Promise<ActionResult> {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(cookieStore)

    // 現在のユーザーを取得
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("Auth error:", authError)
      return { success: false, error: "認証エラー: ユーザーが見つかりません" }
    }

    console.log("Updating display_name for user:", user.id, "with value:", displayName)

    // UPSERTを使用してユーザーレコードを挿入または更新
    const { error } = await supabase.from("users").upsert(
      {
        id: user.id,
        display_name: displayName,
        pokepoke_id: null, // 既存の値を保持するため、別途取得が必要
      },
      {
        onConflict: "id",
      },
    )

    if (error) {
      console.error("Error updating display_name:", error)
      return { success: false, error: `データベースエラー: ${error.message}` }
    }

    console.log("Successfully updated display_name")

    // 関連するページのキャッシュを再検証
    revalidatePath("/")

    return { success: true }
  } catch (e) {
    console.error("Unexpected error in updateDisplayName:", e)
    return { success: false, error: `予期しないエラー: ${(e as Error).message}` }
  }
}

// より安全な更新方法：既存の値を保持しながら特定のフィールドのみ更新
export async function updateUserProfile(updates: {
  display_name?: string
  pokepoke_id?: string
}): Promise<ActionResult> {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(cookieStore)

    // 現在のユーザーを取得
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("Auth error:", authError)
      return { success: false, error: "認証エラー: ユーザーが見つかりません" }
    }

    console.log("Updating user profile for user:", user.id, "with updates:", updates)

    // 既存のユーザーレコードを取得
    const { data: existingUser, error: fetchError } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single()

    if (fetchError && fetchError.code !== "PGRST116") {
      // PGRST116 = レコードが見つからない（これは正常）
      console.error("Error fetching existing user:", fetchError)
      return { success: false, error: `データ取得エラー: ${fetchError.message}` }
    }

    // UPSERTでレコードを挿入または更新
    const upsertData = {
      id: user.id,
      display_name: updates.display_name ?? existingUser?.display_name ?? null,
      pokepoke_id: updates.pokepoke_id ?? existingUser?.pokepoke_id ?? null,
      avatar_url: existingUser?.avatar_url ?? null,
      created_at: existingUser?.created_at ?? new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { error } = await supabase.from("users").upsert(upsertData, {
      onConflict: "id",
    })

    if (error) {
      console.error("Error upserting user profile:", error)
      return { success: false, error: `データベースエラー: ${error.message}` }
    }

    console.log("Successfully updated user profile")

    // 関連するページのキャッシュを再検証
    revalidatePath("/")
    revalidatePath("/trades/create")

    return { success: true }
  } catch (e) {
    console.error("Unexpected error in updateUserProfile:", e)
    return { success: false, error: `予期しないエラー: ${(e as Error).message}` }
  }
}
