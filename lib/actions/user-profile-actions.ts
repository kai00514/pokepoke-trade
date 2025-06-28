"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export interface ActionResult {
  success: boolean
  error?: string
}

export async function updatePokepokeId(pokepokeId: string): Promise<ActionResult> {
  try {
    const supabase = await createServerClient()

    // 現在のユーザーを取得
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: "認証エラー: ユーザーが見つかりません" }
    }

    // public.usersテーブルを更新
    const { error } = await supabase.from("users").update({ pokepoke_id: pokepokeId }).eq("id", user.id)

    if (error) {
      console.error("Error updating pokepoke_id:", error)
      return { success: false, error: error.message }
    }

    // 関連するページのキャッシュを再検証
    revalidatePath("/")
    revalidatePath("/trades/create")

    return { success: true }
  } catch (e) {
    console.error("Unexpected error in updatePokepokeId:", e)
    return { success: false, error: (e as Error).message }
  }
}

export async function updateDisplayName(displayName: string): Promise<ActionResult> {
  try {
    const supabase = await createServerClient()

    // 現在のユーザーを取得
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: "認証エラー: ユーザーが見つかりません" }
    }

    // public.usersテーブルを更新
    const { error } = await supabase.from("users").update({ display_name: displayName }).eq("id", user.id)

    if (error) {
      console.error("Error updating display_name:", error)
      return { success: false, error: error.message }
    }

    // 関連するページのキャッシュを再検証
    revalidatePath("/")

    return { success: true }
  } catch (e) {
    console.error("Unexpected error in updateDisplayName:", e)
    return { success: false, error: (e as Error).message }
  }
}
