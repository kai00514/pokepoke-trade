// 既存のlib/services/deck-services.tsと統合するためのファイル
import { supabase } from "./supabase/client" // 既存のSupabaseクライアントを使用

export async function getDeckById(id: string) {
  console.log("=== getDeckById Debug ===")
  console.log("Fetching deck by ID:", id)

  try {
    const { data, error } = await supabase.from("deck_pages").select("*").eq("id", id).eq("is_published", true).single()

    console.log("Deck by ID result:", {
      data: data ? { id: data.id, title: data.title } : null,
      error: error,
      hasData: !!data,
    })

    if (error) {
      console.error("Supabase error details:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      })

      if (error.code === "PGRST116") {
        // No rows returned
        return null
      }

      throw new Error(`Failed to fetch deck: ${error.message}`)
    }

    // ビュー数を増加（非同期で実行、エラーは無視）
    supabase
      .from("deck_pages")
      .update({ view_count: (data.view_count || 0) + 1 })
      .eq("id", id)
      .then(({ error }) => {
        if (error) {
          console.warn("Failed to update view count:", error)
        }
      })

    return data
  } catch (error) {
    console.error("getDeckById error:", error)
    throw error
  }
}
