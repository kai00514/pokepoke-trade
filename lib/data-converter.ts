import { supabase } from "./supabase/client" // 既存のSupabaseクライアントを使用
import type { DeckListResponse } from "../types/deck-list"

export async function getDeckList(
  page = 1,
  limit = 20,
  sortBy: "latest" | "popular" | "tier" = "latest",
): Promise<DeckListResponse> {
  const offset = (page - 1) * limit

  console.log("=== getDeckList Debug ===")
  console.log("Params:", { page, limit, sortBy, offset })

  try {
    let query = supabase
      .from("deck_pages")
      .select(
        `
        id,
        title,
        deck_name,
        thumbnail_image_url,
        tier_rank,
        view_count,
        like_count,
        comment_count,
        updated_at,
        is_published
      `,
        { count: "exact" },
      )
      .eq("is_published", true)
      .range(offset, offset + limit - 1)

    // ソート条件
    switch (sortBy) {
      case "latest":
        query = query.order("updated_at", { ascending: false })
        break
      case "popular":
        query = query.order("view_count", { ascending: false })
        break
      case "tier":
        query = query.order("tier_rank", { ascending: true }).order("view_count", { ascending: false })
        break
    }

    console.log("Executing query...")
    const { data, error, count } = await query

    console.log("Query result:", {
      data: data,
      error: error,
      count: count,
      dataLength: data?.length,
    })

    if (error) {
      console.error("Supabase error details:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      })
      throw new Error(`Failed to fetch deck list: ${error.message}`)
    }

    const total = count || 0
    const hasMore = offset + limit < total

    const result = {
      decks: data || [],
      total,
      hasMore,
    }

    console.log("Final result:", result)
    return result
  } catch (error) {
    console.error("getDeckList error:", error)
    throw error
  }
}

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
