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
  console.log("🔍 getDeckById called with deckId:", deckId)
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

    console.log("🔍 getDeckById supabase response:", { data, error })

    if (error) {
      console.error("🔍 getDeckById error:", error)
      return { data: null, error: error.message }
    }

    console.log("🔍 getDeckById success, returning data:", data)
    return { data, error: null }
  } catch (err) {
    console.error("🔍 getDeckById exception:", err)
    return { data: null, error: err instanceof Error ? err.message : "Unknown error" }
  }
}

export async function likeDeck(deckId: string): Promise<{ error: string | null }> {
  console.log("👍 likeDeck called with deckId:", deckId)
  console.log("👍 Supabase client:", supabase)

  try {
    console.log("👍 Calling supabase.rpc('increment_deck_likes')")
    const { data, error: updateError } = await supabase.rpc("increment_deck_likes", {
      deck_id_input: deckId,
    })

    console.log("👍 RPC response:", { data, error: updateError })

    if (updateError) {
      console.error("👍 RPC increment_deck_likes error:", updateError)
      return { error: updateError.message }
    }

    console.log("👍 likeDeck successful")
    return { error: null }
  } catch (err) {
    console.error("👍 likeDeck exception:", err)
    return { error: err instanceof Error ? err.message : "Unknown error" }
  }
}

export async function unlikeDeck(deckId: string): Promise<{ error: string | null }> {
  console.log("👎 unlikeDeck called with deckId:", deckId)
  console.log("👎 Supabase client:", supabase)

  try {
    console.log("👎 Calling supabase.rpc('decrement_deck_likes')")
    const { data, error: updateError } = await supabase.rpc("decrement_deck_likes", {
      deck_id_input: deckId,
    })

    console.log("👎 RPC response:", { data, error: updateError })

    if (updateError) {
      console.error("👎 RPC decrement_deck_likes error:", updateError)
      return { error: updateError.message }
    }

    console.log("👎 unlikeDeck successful")
    return { error: null }
  } catch (err) {
    console.error("👎 unlikeDeck exception:", err)
    return { error: err instanceof Error ? err.message : "Unknown error" }
  }
}

export async function favoriteDeck(deckId: string): Promise<{ error: string | null }> {
  console.log("⭐ favoriteDeck called with deckId:", deckId)
  console.log("⭐ Supabase client:", supabase)

  try {
    console.log("⭐ Calling supabase.rpc('increment_deck_favorites')")
    const { data, error: updateError } = await supabase.rpc("increment_deck_favorites", {
      deck_id_input: deckId,
    })

    console.log("⭐ RPC response:", { data, error: updateError })

    if (updateError) {
      console.error("⭐ RPC increment_deck_favorites error:", updateError)
      return { error: updateError.message }
    }

    console.log("⭐ favoriteDeck successful")
    return { error: null }
  } catch (err) {
    console.error("⭐ favoriteDeck exception:", err)
    return { error: err instanceof Error ? err.message : "Unknown error" }
  }
}

export async function unfavoriteDeck(deckId: string): Promise<{ error: string | null }> {
  console.log("⭐❌ unfavoriteDeck called with deckId:", deckId)
  console.log("⭐❌ Supabase client:", supabase)

  try {
    console.log("⭐❌ Calling supabase.rpc('decrement_deck_favorites')")
    const { data, error: updateError } = await supabase.rpc("decrement_deck_favorites", {
      deck_id_input: deckId,
    })

    console.log("⭐❌ RPC response:", { data, error: updateError })

    if (updateError) {
      console.error("⭐❌ RPC decrement_deck_favorites error:", updateError)
      return { error: updateError.message }
    }

    console.log("⭐❌ unfavoriteDeck successful")
    return { error: null }
  } catch (err) {
    console.error("⭐❌ unfavoriteDeck exception:", err)
    return { error: err instanceof Error ? err.message : "Unknown error" }
  }
}
