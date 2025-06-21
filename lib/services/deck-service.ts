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

    console.log("🔍 getDeckById success, comment_count:", data.comment_count)
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

export async function favoriteDeck(deckId: string, category = "posts"): Promise<{ error: string | null }> {
  console.log("⭐ favoriteDeck called with deckId:", deckId, "category:", category)
  console.log("⭐ Supabase client:", supabase)

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      console.error("⭐ User not authenticated:", userError?.message)
      return { error: "ユーザーが認証されていません。" }
    }

    const { error: insertError } = await supabase.from("deck_favorites").insert({
      user_id: user.id,
      deck_id: deckId,
      category: category,
    })

    if (insertError) {
      if (insertError.code === "23505") {
        console.warn("⭐ Deck already favorited by this user:", deckId)
        return { error: null }
      }
      console.error("⭐ Insert into deck_favorites error:", insertError)
      return { error: insertError.message }
    }

    console.log("⭐ Calling supabase.rpc('increment_deck_favorites')")
    const { data, error: rpcError } = await supabase.rpc("increment_deck_favorites", {
      deck_id_input: deckId,
    })

    console.log("⭐ RPC response:", { data, error: rpcError })

    if (rpcError) {
      console.error("⭐ RPC increment_deck_favorites error:", rpcError)
      return { error: rpcError.message }
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
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      console.error("⭐❌ User not authenticated:", userError?.message)
      return { error: "ユーザーが認証されていません。" }
    }

    const { error: deleteError } = await supabase
      .from("deck_favorites")
      .delete()
      .eq("user_id", user.id)
      .eq("deck_id", deckId)

    if (deleteError) {
      console.error("⭐❌ Delete from deck_favorites error:", deleteError)
      return { error: deleteError.message }
    }

    console.log("⭐❌ Calling supabase.rpc('decrement_deck_favorites')")
    const { data, error: rpcError } = await supabase.rpc("decrement_deck_favorites", {
      deck_id_input: deckId,
    })

    console.log("⭐❌ RPC response:", { data, error: rpcError })

    if (rpcError) {
      console.error("⭐❌ RPC decrement_deck_favorites error:", rpcError)
      return { error: rpcError.message }
    }

    console.log("⭐❌ unfavoriteDeck successful")
    return { error: null }
  } catch (err) {
    console.error("⭐❌ unfavoriteDeck exception:", err)
    return { error: err instanceof Error ? err.message : "Unknown error" }
  }
}

export async function isFavorited(deckId: string): Promise<boolean> {
  console.log("❓ isFavorited called with deckId:", deckId)
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      console.log("❓ User not logged in or error getting user:", userError?.message)
      return false
    }

    const { data, error } = await supabase
      .from("deck_favorites")
      .select("id")
      .eq("user_id", user.id)
      .eq("deck_id", deckId)
      .single()

    if (error && error.code !== "PGRST116") {
      console.error("❓ isFavorited query error:", error)
      return false
    }

    console.log("❓ isFavorited result:", !!data)
    return !!data
  } catch (err) {
    console.error("❓ isFavorited exception:", err)
    return false
  }
}
