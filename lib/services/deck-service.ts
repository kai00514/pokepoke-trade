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
  comment_count?: number
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
    console.log("Fetching deck data for ID:", deckId)
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
      console.error("Error fetching deck:", error)
      return { data: null, error: error.message }
    }

    console.log("Fetched deck data:", data)
    return { data, error: null }
  } catch (err) {
    console.error("Exception in getDeckById:", err)
    return { data: null, error: err instanceof Error ? err.message : "Unknown error" }
  }
}

export async function likeDeck(deckId: string): Promise<{ error: string | null }> {
  try {
    console.log("Calling increment_deck_likes for deck:", deckId)

    const { data, error: updateError } = await supabase.rpc("increment_deck_likes", {
      deck_id_input: deckId,
    })

    if (updateError) {
      console.error("RPC increment_deck_likes error:", updateError)
      return { error: updateError.message }
    }

    console.log("increment_deck_likes successful, response:", data)
    return { error: null }
  } catch (err) {
    console.error("Exception in likeDeck:", err)
    return { error: err instanceof Error ? err.message : "Unknown error" }
  }
}

export async function unlikeDeck(deckId: string): Promise<{ error: string | null }> {
  try {
    console.log("Calling decrement_deck_likes for deck:", deckId)

    const { data, error: updateError } = await supabase.rpc("decrement_deck_likes", {
      deck_id_input: deckId,
    })

    if (updateError) {
      console.error("RPC decrement_deck_likes error:", updateError)
      return { error: updateError.message }
    }

    console.log("decrement_deck_likes successful, response:", data)
    return { error: null }
  } catch (err) {
    console.error("Exception in unlikeDeck:", err)
    return { error: err instanceof Error ? err.message : "Unknown error" }
  }
}

export async function favoriteDeck(deckId: string): Promise<{ error: string | null }> {
  try {
    console.log("Calling increment_deck_favorites for deck:", deckId)

    const { data, error: updateError } = await supabase.rpc("increment_deck_favorites", {
      deck_id_input: deckId,
    })

    if (updateError) {
      console.error("RPC increment_deck_favorites error:", updateError)
      return { error: updateError.message }
    }

    console.log("increment_deck_favorites successful, response:", data)
    return { error: null }
  } catch (err) {
    console.error("Exception in favoriteDeck:", err)
    return { error: err instanceof Error ? err.message : "Unknown error" }
  }
}

export async function unfavoriteDeck(deckId: string): Promise<{ error: string | null }> {
  try {
    console.log("Calling decrement_deck_favorites for deck:", deckId)

    const { data, error: updateError } = await supabase.rpc("decrement_deck_favorites", {
      deck_id_input: deckId,
    })

    if (updateError) {
      console.error("RPC decrement_deck_favorites error:", updateError)
      return { error: updateError.message }
    }

    console.log("decrement_deck_favorites successful, response:", data)
    return { error: null }
  } catch (err) {
    console.error("Exception in unfavoriteDeck:", err)
    return { error: err instanceof Error ? err.message : "Unknown error" }
  }
}
