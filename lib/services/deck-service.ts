import { createBrowserClient } from "@/lib/supabase/client"
import type { Deck } from "@/types/deck" // 新しいDeckインターフェースをインポート

const supabase = createBrowserClient()

export async function getDeckById(deckId: string): Promise<{ data: Deck | null; error: string | null }> {
  console.log(`[DeckService:getDeckById] Fetching deck with ID: ${deckId}`)
  try {
    // 1. 'decks'テーブル（ユーザー作成デッキ）から取得を試みる
    const { data: deckData, error: deckError } = await supabase
      .from("decks")
      .select(
        `
        id,
        user_id,
        title,
        description,
        created_at,
        updated_at,
        like_count,
        favorite_count,
        comment_count,
        view_count,
        is_public,
        tags,
        thumbnail_card_id,
        user_profiles (display_name),
        cards:thumbnail_card_id (id, name, image_url, thumb_url)
        `,
      )
      .eq("id", deckId)
      .single()

    if (deckError && deckError.code !== "PGRST116") {
      // PGRST116 = no rows returned
      console.error(`[DeckService:getDeckById] Error fetching from 'decks' table for ID ${deckId}:`, deckError)
    } else if (deckData) {
      console.log(`[DeckService:getDeckById] Data found in 'decks' table for ID ${deckId}:`, deckData)
      const mappedDeck: Deck = {
        id: deckData.id,
        title: deckData.title || null,
        description: deckData.description || null,
        created_at: deckData.created_at,
        updated_at: deckData.updated_at,
        like_count: deckData.like_count || 0,
        favorite_count: deckData.favorite_count || 0,
        comment_count: deckData.comment_count || 0,
        view_count: deckData.view_count || 0,
        user_id: deckData.user_id,
        is_public: deckData.is_public,
        tags: deckData.tags,
        thumbnail_card_id: deckData.thumbnail_card_id,
        thumbnail_image: deckData.cards
          ? {
              id: deckData.cards.id,
              name: deckData.cards.name,
              image_url: deckData.cards.image_url,
              thumb_url: deckData.cards.thumb_url,
            }
          : undefined,
        user_display_name: deckData.user_profiles?.display_name || null,
        is_deck_page: false, // decksテーブルからのデータ
      }
      console.log(`[DeckService:getDeckById] Mapped Deck object from 'decks' for ID ${deckId}:`, mappedDeck)
      return { data: mappedDeck, error: null }
    }

    // 2. 'decks' テーブルで見つからなかった場合、'deck_pages' テーブルから取得を試みる
    const { data: deckPageData, error: deckPageError } = await supabase
      .from("deck_pages")
      .select(
        `
        id,
        deck_name,
        deck_description,
        thumbnail_image_url,
        tier_rank,
        view_count,
        like_count,
        comment_count,
        favorite_count,
        created_at,
        updated_at,
        category,
        user_profiles (display_name)
        `,
      )
      .eq("id", deckId)
      .single()

    if (deckPageError && deckPageError.code !== "PGRST116") {
      console.error(`[DeckService:getDeckById] Error fetching from 'deck_pages' table for ID ${deckId}:`, deckPageError)
    } else if (deckPageData) {
      console.log(`[DeckService:getDeckById] Data found in 'deck_pages' table for ID ${deckId}:`, deckPageData)
      const mappedDeck: Deck = {
        id: deckPageData.id,
        title: deckPageData.deck_name || null,
        description: deckPageData.deck_description || null,
        created_at: deckPageData.created_at,
        updated_at: deckPageData.updated_at || deckPageData.created_at,
        like_count: deckPageData.like_count || 0,
        favorite_count: deckPageData.favorite_count || 0,
        comment_count: deckPageData.comment_count || 0,
        view_count: deckPageData.view_count || 0,
        thumbnail_image_url: deckPageData.thumbnail_image_url || null,
        tier_rank: deckPageData.tier_rank,
        category: deckPageData.category,
        user_display_name: deckPageData.user_profiles?.display_name || null,
        is_deck_page: true, // deck_pagesテーブルからのデータ
      }
      console.log(`[DeckService:getDeckById] Mapped Deck object from 'deck_pages' for ID ${deckId}:`, mappedDeck)
      return { data: mappedDeck, error: null }
    }

    const errorMessage = deckError?.message || deckPageError?.message || "Deck not found"
    console.log(`[DeckService:getDeckById] Deck not found for ID ${deckId}. Error: ${errorMessage}`)
    return { data: null, error: errorMessage }
  } catch (error) {
    console.error(`[DeckService:getDeckById] Unexpected exception for ID ${deckId}:`, error)
    return { data: null, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function likeDeck(deckId: string): Promise<{ error: string | null }> {
  console.log(`[DeckService:likeDeck] Liking deck ID: ${deckId}`)
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.log("[DeckService:likeDeck] User not logged in. Not recording in DB.")
      return { error: null } // ゲストユーザーでもいいねは可能だが、DBには記録しない
    }
    console.log(`[DeckService:likeDeck] User ${user.id} is liking deck ${deckId}`)

    const { error } = await supabase.from("deck_likes").insert({
      user_id: user.id,
      deck_id: deckId,
    })

    if (error) {
      if (error.code === "23505") {
        // unique constraint violation
        console.warn(`[DeckService:likeDeck] User ${user.id} already liked deck ${deckId}.`)
        return { error: "既にいいねしています" }
      }
      console.error(`[DeckService:likeDeck] Error inserting into deck_likes for ID ${deckId}:`, error)
      throw error
    }
    console.log(`[DeckService:likeDeck] Successfully inserted like for deck ${deckId}. Calling RPC.`)

    const { error: rpcError } = await supabase.rpc("increment_deck_likes", {
      deck_id_input: deckId,
    })
    if (rpcError) {
      console.error(`[DeckService:likeDeck] Error incrementing like count via RPC for ID ${deckId}:`, rpcError)
      // RPCエラーが発生した場合、挿入したレコードを削除してロールバックする
      await supabase.from("deck_likes").delete().eq("user_id", user.id).eq("deck_id", deckId)
      return { error: rpcError.message }
    }
    console.log(`[DeckService:likeDeck] Successfully incremented like count for deck ${deckId}.`)

    return { error: null }
  } catch (error) {
    console.error(`[DeckService:likeDeck] Unexpected exception for ID ${deckId}:`, error)
    return { error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function unlikeDeck(deckId: string): Promise<{ error: string | null }> {
  console.log(`[DeckService:unlikeDeck] Unliking deck ID: ${deckId}`)
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.log("[DeckService:unlikeDeck] User not logged in. No DB operation needed.")
      return { error: null } // ゲストユーザーの場合、DB操作は不要
    }
    console.log(`[DeckService:unlikeDeck] User ${user.id} is unliking deck ${deckId}`)

    const { error } = await supabase.from("deck_likes").delete().eq("user_id", user.id).eq("deck_id", deckId)

    if (error) {
      console.error(`[DeckService:unlikeDeck] Error deleting from deck_likes for ID ${deckId}:`, error)
      throw error
    }
    console.log(`[DeckService:unlikeDeck] Successfully deleted like for deck ${deckId}. Calling RPC.`)

    const { error: rpcError } = await supabase.rpc("decrement_deck_likes", {
      deck_id_input: deckId,
    })
    if (rpcError) {
      console.error(`[DeckService:unlikeDeck] Error decrementing like count via RPC for ID ${deckId}:`, rpcError)
      // RPCエラーが発生した場合、削除したレコードを再挿入してロールバックする
      await supabase.from("deck_likes").insert({ user_id: user.id, deck_id: deckId })
      return { error: rpcError.message }
    }
    console.log(`[DeckService:unlikeDeck] Successfully decremented like count for deck ${deckId}.`)

    return { error: null }
  } catch (error) {
    console.error(`[DeckService:unlikeDeck] Unexpected exception for ID ${deckId}:`, error)
    return { error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function favoriteDeck(deckId: string): Promise<{ error: string | null }> {
  console.log(`[DeckService:favoriteDeck] Favoriting deck ID: ${deckId}`)
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.log("[DeckService:favoriteDeck] User not logged in. Returning error.")
      return { error: "ログインが必要です" }
    }
    console.log(`[DeckService:favoriteDeck] User ${user.id} is favoriting deck ${deckId}`)

    const { error } = await supabase.from("deck_favorites").insert({
      user_id: user.id,
      deck_id: deckId,
    })

    if (error) {
      if (error.code === "23505") {
        // unique constraint violation
        console.warn(`[DeckService:favoriteDeck] User ${user.id} already favorited deck ${deckId}.`)
        return { error: "既にお気に入りに追加されています" }
      }
      console.error(`[DeckService:favoriteDeck] Error inserting into deck_favorites for ID ${deckId}:`, error)
      throw error
    }
    console.log(`[DeckService:favoriteDeck] Successfully inserted favorite for deck ${deckId}. Calling RPC.`)

    const { error: rpcError } = await supabase.rpc("increment_deck_favorites", {
      deck_id_input: deckId,
    })
    if (rpcError) {
      console.error(`[DeckService:favoriteDeck] Error incrementing favorite count via RPC for ID ${deckId}:`, rpcError)
      await supabase.from("deck_favorites").delete().eq("user_id", user.id).eq("deck_id", deckId)
      return { error: rpcError.message }
    }
    console.log(`[DeckService:favoriteDeck] Successfully incremented favorite count for deck ${deckId}.`)

    return { error: null }
  } catch (error) {
    console.error(`[DeckService:favoriteDeck] Unexpected exception for ID ${deckId}:`, error)
    return { error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function unfavoriteDeck(deckId: string): Promise<{ error: string | null }> {
  console.log(`[DeckService:unfavoriteDeck] Unfavoriting deck ID: ${deckId}`)
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.log("[DeckService:unfavoriteDeck] User not logged in. Returning error.")
      return { error: "ログインが必要です" }
    }
    console.log(`[DeckService:unfavoriteDeck] User ${user.id} is unfavoriting deck ${deckId}`)

    const { error } = await supabase.from("deck_favorites").delete().eq("user_id", user.id).eq("deck_id", deckId)

    if (error) {
      console.error(`[DeckService:unfavoriteDeck] Error deleting from deck_favorites for ID ${deckId}:`, error)
      throw error
    }
    console.log(`[DeckService:unfavoriteDeck] Successfully deleted favorite for deck ${deckId}. Calling RPC.`)

    const { error: rpcError } = await supabase.rpc("decrement_deck_favorites", {
      deck_id_input: deckId,
    })
    if (rpcError) {
      console.error(
        `[DeckService:unfavoriteDeck] Error decrementing favorite count via RPC for ID ${deckId}:`,
        rpcError,
      )
      await supabase.from("deck_favorites").insert({ user_id: user.id, deck_id: deckId })
      return { error: rpcError.message }
    }
    console.log(`[DeckService:unfavoriteDeck] Successfully decremented favorite count for deck ${deckId}.`)

    return { error: null }
  } catch (error) {
    console.error(`[DeckService:unfavoriteDeck] Unexpected exception for ID ${deckId}:`, error)
    return { error: error instanceof Error ? error.message : "Unknown error" }
  }
}
