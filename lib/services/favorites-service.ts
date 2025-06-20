import { createClient } from "@/lib/supabase/client"
import type { Database } from "@/types/supabase"

type DeckFavorite = Database["public"]["Tables"]["deck_favorites"]["Row"]
type DeckWithDetails = Database["public"]["Tables"]["decks"]["Row"] & {
  user_profiles?: {
    display_name: string | null
  } | null
}

export class FavoritesService {
  private supabase = createClient()

  // お気に入りに追加
  async addToFavorites(deckId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const {
        data: { user },
      } = await this.supabase.auth.getUser()

      if (!user) {
        return { success: false, error: "ログインが必要です" }
      }

      const { error } = await this.supabase.from("deck_favorites").insert({
        user_id: user.id,
        deck_id: deckId,
      })

      if (error) {
        if (error.code === "23505") {
          // unique constraint violation
          return { success: false, error: "既にお気に入りに追加されています" }
        }
        throw error
      }

      return { success: true }
    } catch (error) {
      console.error("Error adding to favorites:", error)
      return { success: false, error: "お気に入りの追加に失敗しました" }
    }
  }

  // お気に入りから削除
  async removeFromFavorites(deckId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const {
        data: { user },
      } = await this.supabase.auth.getUser()

      if (!user) {
        return { success: false, error: "ログインが必要です" }
      }

      const { error } = await this.supabase.from("deck_favorites").delete().eq("user_id", user.id).eq("deck_id", deckId)

      if (error) {
        throw error
      }

      return { success: true }
    } catch (error) {
      console.error("Error removing from favorites:", error)
      return { success: false, error: "お気に入りの削除に失敗しました" }
    }
  }

  // お気に入り状態をチェック
  async isFavorited(deckId: string): Promise<boolean> {
    try {
      const {
        data: { user },
      } = await this.supabase.auth.getUser()

      if (!user) {
        return false
      }

      const { data, error } = await this.supabase
        .from("deck_favorites")
        .select("id")
        .eq("user_id", user.id)
        .eq("deck_id", deckId)
        .single()

      if (error && error.code !== "PGRST116") {
        // PGRST116 = no rows returned
        throw error
      }

      return !!data
    } catch (error) {
      console.error("Error checking favorite status:", error)
      return false
    }
  }

  // お気に入りデッキ一覧を取得
  async getFavoriteDecks(): Promise<{ decks: DeckWithDetails[]; error?: string }> {
    try {
      const {
        data: { user },
      } = await this.supabase.auth.getUser()

      if (!user) {
        return { decks: [], error: "ログインが必要です" }
      }

      const { data, error } = await this.supabase
        .from("deck_favorites")
        .select(`
          deck_id,
          created_at,
          decks (
            id,
            title,
            description,
            like_count,
            favorite_count,
            comment_count,
            view_count,
            tier,
            tags,
            created_at,
            updated_at,
            thumbnail_card_id,
            user_profiles (
              display_name
            )
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) {
        throw error
      }

      const decks = (data?.map((item) => item.decks).filter(Boolean) as DeckWithDetails[]) || []

      return { decks }
    } catch (error) {
      console.error("Error fetching favorite decks:", error)
      return { decks: [], error: "お気に入りデッキの取得に失敗しました" }
    }
  }

  // お気に入り数を取得
  async getFavoriteCount(deckId: string): Promise<number> {
    try {
      const { count, error } = await this.supabase
        .from("deck_favorites")
        .select("*", { count: "exact", head: true })
        .eq("deck_id", deckId)

      if (error) {
        throw error
      }

      return count || 0
    } catch (error) {
      console.error("Error getting favorite count:", error)
      return 0
    }
  }
}

export const favoritesService = new FavoritesService()
