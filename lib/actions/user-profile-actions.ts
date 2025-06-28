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

    // クライアントサイドで現在のユーザーIDを取得する必要があるため、
    // サーバーアクションではなくクライアントサイドで処理する
    const supabase = await createServerClient()

    // 直接データベースに接続してUPSERT操作を実行
    const { data, error } = await supabase
      .from("users")
      .upsert(
        {
          pokepoke_id: pokepokeId,
        },
        {
          onConflict: "id",
        },
      )
      .select("id, name, email, display_name, pokepoke_id, avatar_url, is_admin")

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

    // 直接データベースに接続してUPSERT操作を実行
    const { data, error } = await supabase
      .from("users")
      .upsert(
        {
          display_name: displayName,
        },
        {
          onConflict: "id",
        },
      )
      .select("id, name, email, display_name, pokepoke_id, avatar_url, is_admin")

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
