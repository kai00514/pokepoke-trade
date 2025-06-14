import { createBrowserClient } from "@/lib/supabase/client"

const supabase = createBrowserClient()

export interface DeckWithCards {
  id: string
  title: string
  description?: string
  user_id: string
  user_display_name?: string
  is_public: boolean
  tags?: string[]
  thumbnail_card_id?: number
  created_at: string
  updated_at: string
  like_count?: number
  favorite_count?: number
  view_count?: number
  deck_cards: Array<{
    card_id: number
    quantity: number
  }>
}

export async function getDeckById(deckId: string): Promise<{
  data: DeckWithCards | null
  error: string | null
}> {
  try {
    const { data, error } = await supabase
      .from("decks")
      .select(`
        *,
        deck_cards (
          card_id,
          quantity
        )
      `)
      .eq("id", deckId)
      .single()

    if (error) {
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : "Unknown error" }
  }
}

export async function likeDeck(deckId: string): Promise<{ error: string | null }> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: "ログインが必要です" }
    }

    // Insert like record
    const { error: insertError } = await supabase.from("deck_likes").insert({
      deck_id: deckId,
      user_id: user.id,
    })

    if (insertError) {
      return { error: insertError.message }
    }

    // Update like count
    const { error: updateError } = await supabase.rpc("increment_deck_likes", {
      deck_id: deckId,
    })

    if (updateError) {
      return { error: updateError.message }
    }

    return { error: null }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unknown error" }
  }
}

export async function unlikeDeck(deckId: string): Promise<{ error: string | null }> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: "ログインが必要です" }
    }

    // Delete like record
    const { error: deleteError } = await supabase
      .from("deck_likes")
      .delete()
      .eq("deck_id", deckId)
      .eq("user_id", user.id)

    if (deleteError) {
      return { error: deleteError.message }
    }

    // Update like count
    const { error: updateError } = await supabase.rpc("decrement_deck_likes", {
      deck_id: deckId,
    })

    if (updateError) {
      return { error: updateError.message }
    }

    return { error: null }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unknown error" }
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

    // Insert favorite record
    const { error: insertError } = await supabase.from("deck_favorites").insert({
      deck_id: deckId,
      user_id: user.id,
    })

    if (insertError) {
      return { error: insertError.message }
    }

    // Update favorite count
    const { error: updateError } = await supabase.rpc("increment_deck_favorites", {
      deck_id: deckId,
    })

    if (updateError) {
      return { error: updateError.message }
    }

    return { error: null }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unknown error" }
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

    // Delete favorite record
    const { error: deleteError } = await supabase
      .from("deck_favorites")
      .delete()
      .eq("deck_id", deckId)
      .eq("user_id", user.id)

    if (deleteError) {
      return { error: deleteError.message }
    }

    // Update favorite count
    const { error: updateError } = await supabase.rpc("decrement_deck_favorites", {
      deck_id: deckId,
    })

    if (updateError) {
      return { error: updateError.message }
    }

    return { error: null }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unknown error" }
  }
}

export async function getDeckUserActions(
  deckId: string,
  userId: string,
): Promise<{ liked: boolean; favorited: boolean }> {
  try {
    // Check if user liked the deck
    const { data: likeData } = await supabase
      .from("deck_likes")
      .select("id")
      .eq("deck_id", deckId)
      .eq("user_id", userId)
      .single()

    // Check if user favorited the deck
    const { data: favoriteData } = await supabase
      .from("deck_favorites")
      .select("id")
      .eq("deck_id", deckId)
      .eq("user_id", userId)
      .single()

    return {
      liked: !!likeData,
      favorited: !!favoriteData,
    }
  } catch (err) {
    return { liked: false, favorited: false }
  }
}
