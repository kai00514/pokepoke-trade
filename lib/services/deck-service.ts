import { createBrowserClient } from "@/lib/supabase/client"

const supabase = createBrowserClient()

export interface DeckWithCards {
  id: string
  title: string
  description?: string
  user_id: string
  user_display_name?: string // このプロパティはauth.usersテーブルから取得されます
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
        id,
        title,
        description,
        user_id,
        is_public,
        tags,
        thumbnail_card_id,
        created_at,
        updated_at,
        like_count,
        favorite_count,
        view_count,
        comment_count,
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

    let userDisplayName: string | null = null
    if (data?.user_id) {
      const { data: userData, error: userError } = await supabase
        .from("users") // auth.usersテーブルを直接参照
        .select("raw_user_meta_data")
        .eq("id", data.user_id)
        .single()

      if (userError) {
        console.error("🔍 Error fetching user data for deck:", userError)
      } else if (userData?.raw_user_meta_data) {
        userDisplayName = (userData.raw_user_meta_data as any).user_name || null
      }
    }

    const deckData: DeckWithCards = {
      ...data,
      user_display_name: userDisplayName,
    } as DeckWithCards

    console.log("🔍 getDeckById success, comment_count:", deckData.comment_count)
    console.log("🔍 getDeckById success, returning data:", deckData)
    return { data: deckData, error: null }
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

    // deck_favoritesテーブルに挿入
    const { error: insertError } = await supabase.from("deck_favorites").insert({
      user_id: user.id,
      deck_id: deckId,
      category: category,
    })

    if (insertError) {
      if (insertError.code === "23505") {
        console.warn("⭐ Deck already favorited by this user:", deckId)
        return { error: null } // 既に存在する場合はエラーとしない
      }
      console.error("⭐ Insert into deck_favorites error:", insertError)
      return { error: insertError.message }
    }

    // RPCを呼び出してカウントを更新
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

    // deck_favoritesテーブルから削除
    const { error: deleteError } = await supabase
      .from("deck_favorites")
      .delete()
      .eq("user_id", user.id)
      .eq("deck_id", deckId)

    if (deleteError) {
      console.error("⭐❌ Delete from deck_favorites error:", deleteError)
      return { error: deleteError.message }
    }

    // RPCを呼び出してカウントを更新
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

export async function getFavoriteDecks(): Promise<{ data: DeckWithCards[]; error: string | null }> {
  console.log("🌟 getFavoriteDecks called")
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error("🌟 User not authenticated:", userError?.message)
      return { data: [], error: "ユーザーが認証されていません。" }
    }

    const { data, error } = await supabase
      .from("deck_favorites")
      .select(
        `
        deck_id,
        category,
        decks (
          id,
          title,
          description,
          user_id,
          is_public,
          tags,
          thumbnail_card_id,
          created_at,
          updated_at,
          like_count,
          favorite_count,
          view_count,
          comment_count,
          deck_cards (
            card_id,
            quantity
          ),
          thumbnail_image:cards!thumbnail_card_id (
            id,
            name,
            image_url,
            thumb_url
          )
        )
      `,
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }) // 新しいお気に入りから表示

    if (error) {
      console.error("🌟 Error fetching favorite decks from DB:", error)
      return { data: [], error: error.message }
    }

    // decksデータからuser_idsを収集
    const userIds = data
      .filter((item) => item.decks !== null)
      .map((item) => item.decks.user_id)
      .filter((id, index, self) => self.indexOf(id) === index) // 重複を排除

    const userDisplayNames: { [key: string]: string } = {}
    if (userIds.length > 0) {
      const { data: usersData, error: usersError } = await supabase
        .from("users") // auth.usersテーブルを直接参照
        .select("id, raw_user_meta_data")
        .in("id", userIds)

      if (usersError) {
        console.error("🌟 Error fetching user display names:", usersError)
      } else {
        usersData.forEach((u) => {
          if (u.raw_user_meta_data) {
            userDisplayNames[u.id] = (u.raw_user_meta_data as any).user_name || ""
          }
        })
      }
    }

    const formattedDecks: DeckWithCards[] = data
      .filter((item) => item.decks !== null)
      .map((item: any) => ({
        id: item.decks.id,
        title: item.decks.title,
        description: item.decks.description,
        user_id: item.decks.user_id,
        user_display_name: userDisplayNames[item.decks.user_id] || null, // auth.usersから取得
        is_public: item.decks.is_public,
        tags: item.decks.tags,
        thumbnail_card_id: item.decks.thumbnail_card_id,
        created_at: item.decks.created_at,
        updated_at: item.decks.updated_at,
        like_count: item.decks.like_count,
        favorite_count: item.decks.favorite_count,
        view_count: item.decks.view_count,
        comment_count: item.decks.comment_count,
        deck_cards: item.decks.deck_cards,
        thumbnail_image: item.decks.thumbnail_image,
        // お気に入りページでの表示用にsource_tabを追加
        source_tab: "お気に入り",
        // お気に入り登録時のカテゴリを保持
        category: item.category,
      }))

    console.log("🌟 getFavoriteDecks successful, returning:", formattedDecks.length, "decks")
    return { data: formattedDecks, error: null }
  } catch (err) {
    console.error("🌟 getFavoriteDecks exception:", err)
    return { data: [], error: err instanceof Error ? err.message : "Unknown error" }
  }
}
