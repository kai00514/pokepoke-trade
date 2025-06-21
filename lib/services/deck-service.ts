import { createBrowserClient } from "@/lib/supabase/client"
import type { Deck } from "@/types/deck" // types/deck.tsからDeckインターフェースをインポート

const supabase = createBrowserClient()

export async function getDeckById(deckId: string): Promise<{ data: Deck | null; error: string | null }> {
  try {
    // 'decks'テーブル（ユーザー作成デッキ）から取得を試みる
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

    if (deckData) {
      const deck: Deck = {
        id: deckData.id,
        user_id: deckData.user_id || undefined,
        title: deckData.title || "",
        description: deckData.description || "",
        created_at: deckData.created_at,
        updated_at: deckData.updated_at,
        like_count: deckData.like_count || 0,
        favorite_count: deckData.favorite_count || 0,
        comment_count: deckData.comment_count || 0,
        view_count: deckData.view_count || 0,
        is_public: deckData.is_public,
        tags: deckData.tags || undefined,
        thumbnail_card_id: deckData.thumbnail_card_id || undefined,
        thumbnail_image: deckData.cards
          ? {
              id: deckData.cards.id,
              name: deckData.cards.name,
              image_url: deckData.cards.image_url,
              thumb_url: deckData.cards.thumb_url,
            }
          : undefined,
        is_deck_page: false, // deck_pageではないことを明示的にマーク
        user_display_name: deckData.user_profiles?.display_name || undefined,
      }
      return { data: deck, error: null }
    }

    // 'decks'で見つからなかった場合、'deck_pages'テーブル（公式/Tierデッキ）から取得を試みる
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

    if (deckPageData) {
      const deck: Deck = {
        id: deckPageData.id,
        deck_name: deckPageData.deck_name || undefined,
        title: deckPageData.deck_name || "", // title も設定
        description: deckPageData.deck_description || undefined,
        updated_at: deckPageData.updated_at || deckPageData.created_at || "",
        tier_rank: deckPageData.tier_rank || undefined,
        view_count: deckPageData.view_count || 0,
        like_count: deckPageData.like_count || 0,
        comment_count: deckPageData.comment_count || 0,
        favorite_count: deckPageData.favorite_count || 0,
        thumbnail_image_url: deckPageData.thumbnail_image_url || undefined,
        is_deck_page: true, // deck_pageであることを明示的にマーク
        category: deckPageData.category || undefined,
        user_display_name: deckPageData.user_profiles?.display_name || undefined,
      }
      return { data: deck, error: null }
    }

    return { data: null, error: deckError?.message || deckPageError?.message || "Deck not found" }
  } catch (error) {
    console.error("Unexpected error in getDeckById:", error)
    return { data: null, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function likeDeck(deckId: string): Promise<{ error: string | null }> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      // ゲストユーザーでもいいねは可能だが、DBには記録しない
      return { error: null }
    }

    const { error } = await supabase.from("deck_likes").insert({
      user_id: user.id,
      deck_id: deckId,
    })

    if (error) {
      if (error.code === "23505") {
        // unique constraint violation
        return { error: "既にいいねしています" }
      }
      throw error
    }

    // RPC関数を直接呼び出す
    const { error: rpcError } = await supabase.rpc("increment_deck_likes", {
      deck_id_input: deckId,
    })
    if (rpcError) {
      console.error("Error incrementing like count via RPC:", rpcError)
      // RPCエラーが発生した場合、挿入したレコードを削除してロールバックする
      await supabase.from("deck_likes").delete().eq("user_id", user.id).eq("deck_id", deckId)
      return { error: rpcError.message }
    }

    return { error: null }
  } catch (error) {
    console.error("Error liking deck:", error)
    return { error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function unlikeDeck(deckId: string): Promise<{ error: string | null }> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      // ゲストユーザーの場合、DB操作は不要
      return { error: null }
    }

    const { error } = await supabase.from("deck_likes").delete().eq("user_id", user.id).eq("deck_id", deckId)

    if (error) {
      throw error
    }

    // RPC関数を直接呼び出す
    const { error: rpcError } = await supabase.rpc("decrement_deck_likes", {
      deck_id_input: deckId,
    })
    if (rpcError) {
      console.error("Error decrementing like count via RPC:", rpcError)
      // RPCエラーが発生した場合、削除したレコードを再挿入してロールバックする
      await supabase.from("deck_likes").insert({ user_id: user.id, deck_id: deckId })
      return { error: rpcError.message }
    }

    return { error: null }
  } catch (error) {
    console.error("Error unliking deck:", error)
    return { error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function favoriteDeck(deckId: string): Promise<{ error: string | null }> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: "ログインが必要です" }
    }

    const { error } = await supabase.from("deck_favorites").insert({
      user_id: user.id,
      deck_id: deckId,
    })

    if (error) {
      if (error.code === "23505") {
        // unique constraint violation
        return { error: "既にお気に入りに追加されています" }
      }
      throw error
    }

    // RPC関数を直接呼び出す
    const { error: rpcError } = await supabase.rpc("increment_deck_favorites", {
      deck_id_input: deckId,
    })
    if (rpcError) {
      console.error("Error incrementing favorite count via RPC:", rpcError)
      await supabase.from("deck_favorites").delete().eq("user_id", user.id).eq("deck_id", deckId)
      return { error: rpcError.message }
    }

    return { error: null }
  } catch (error) {
    console.error("Error favoriting deck:", error)
    return { error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function unfavoriteDeck(deckId: string): Promise<{ error: string | null }> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: "ログインが必要です" }
    }

    const { error } = await supabase.from("deck_favorites").delete().eq("user_id", user.id).eq("deck_id", deckId)

    if (error) {
      throw error
    }

    // RPC関数を直接呼び出す
    const { error: rpcError } = await supabase.rpc("decrement_deck_favorites", {
      deck_id_input: deckId,
    })
    if (rpcError) {
      console.error("Error decrementing favorite count via RPC:", rpcError)
      await supabase.from("deck_favorites").insert({ user_id: user.id, deck_id: deckId })
      return { error: rpcError.message }
    }

    return { error: null }
  } catch (error) {
    console.error("Error unfavoriting deck:", error)
    return { error: error instanceof Error ? error.message : "Unknown error" }
  }
}
