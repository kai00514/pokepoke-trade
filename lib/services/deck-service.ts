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
  // deck_pagesからのデータの場合に備えて追加
  is_deck_page?: boolean
  deck_name?: string
  thumbnail_image_url?: string
  tier_rank?: number
}

export async function getDeckById(deckId: string): Promise<{
  data: DeckWithCards | null
  error: string | null
}> {
  console.log("🔍 getDeckById called with deckId:", deckId)

  try {
    // まず decks テーブルを確認
    console.log("🔍 Checking decks table first...")
    const { data: deckData, error: deckError } = await supabase
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

    if (deckData && !deckError) {
      console.log("✅ Found in decks table")

      // ユーザー表示名を取得
      let userDisplayName: string | null = null
      if (deckData.user_id) {
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("raw_user_meta_data")
          .eq("id", deckData.user_id)
          .single()

        if (!userError && userData?.raw_user_meta_data) {
          userDisplayName = (userData.raw_user_meta_data as any).user_name || null
        }
      }

      const result: DeckWithCards = {
        ...deckData,
        user_display_name: userDisplayName,
        is_deck_page: false,
      } as DeckWithCards

      console.log("🔍 getDeckById success from decks table, comment_count:", result.comment_count)
      return { data: result, error: null }
    }

    // decks テーブルにない場合は deck_pages テーブルを確認
    console.log("🔍 Not found in decks table, checking deck_pages table...")
    const { data: deckPageData, error: deckPageError } = await supabase
      .from("deck_pages")
      .select(`
        id,
        title,
        deck_name,
        thumbnail_image_url,
        updated_at,
        tier_rank,
        view_count,
        like_count,
        comment_count,
        favorite_count
      `)
      .eq("id", deckId)
      .single()

    if (deckPageData && !deckPageError) {
      console.log("✅ Found in deck_pages table")

      const result: DeckWithCards = {
        id: deckPageData.id,
        title: deckPageData.title || deckPageData.deck_name || "無題のデッキ",
        description: null,
        user_id: "", // deck_pagesにはuser_idがない
        user_display_name: null,
        is_public: true,
        tags: [],
        thumbnail_card_id: null,
        created_at: deckPageData.updated_at,
        updated_at: deckPageData.updated_at,
        like_count: deckPageData.like_count || 0,
        favorite_count: deckPageData.favorite_count || 0,
        view_count: deckPageData.view_count || 0,
        comment_count: deckPageData.comment_count || 0,
        deck_cards: [],
        is_deck_page: true,
        deck_name: deckPageData.deck_name,
        thumbnail_image_url: deckPageData.thumbnail_image_url,
        tier_rank: deckPageData.tier_rank,
      }

      console.log("🔍 getDeckById success from deck_pages table, comment_count:", result.comment_count)
      return { data: result, error: null }
    }

    // どちらのテーブルにも見つからない場合
    console.log("❌ Deck not found in either table")
    return { data: null, error: "デッキが見つかりません" }
  } catch (err) {
    console.error("🔍 getDeckById exception:", err)
    return { data: null, error: err instanceof Error ? err.message : "Unknown error" }
  }
}

export async function likeDeck(id: string, isDeckPage = false): Promise<{ error: string | null }> {
  console.log("👍 likeDeck called with id:", id, "isDeckPage:", isDeckPage)

  try {
    let rpcError: any = null
    if (isDeckPage) {
      console.log("👍 Calling supabase.rpc('increment_deck_page_likes') for deck_page")
      const { error } = await supabase.rpc("increment_deck_page_likes", {
        deck_page_id_input: id,
      })
      rpcError = error
    } else {
      console.log("👍 Calling supabase.rpc('increment_deck_likes') for deck")
      const { error } = await supabase.rpc("increment_deck_likes", {
        deck_id_input: id,
      })
      rpcError = error
    }

    if (rpcError) {
      console.error("👍 RPC increment_likes error:", rpcError)
      return { error: rpcError.message }
    }

    console.log("👍 likeDeck successful")
    return { error: null }
  } catch (err) {
    console.error("👍 likeDeck exception:", err)
    return { error: err instanceof Error ? err.message : "Unknown error" }
  }
}

export async function unlikeDeck(id: string, isDeckPage = false): Promise<{ error: string | null }> {
  console.log("👎 unlikeDeck called with id:", id, "isDeckPage:", isDeckPage)

  try {
    let rpcError: any = null
    if (isDeckPage) {
      console.log("👎 Calling supabase.rpc('decrement_deck_page_likes') for deck_page")
      const { error } = await supabase.rpc("decrement_deck_page_likes", {
        deck_page_id_input: id,
      })
      rpcError = error
    } else {
      console.log("👎 Calling supabase.rpc('decrement_deck_likes') for deck")
      const { error } = await supabase.rpc("decrement_deck_likes", {
        deck_id_input: id,
      })
      rpcError = error
    }

    if (rpcError) {
      console.error("👎 RPC decrement_likes error:", rpcError)
      return { error: rpcError.message }
    }

    console.log("👎 unlikeDeck successful")
    return { error: null }
  } catch (err) {
    console.error("👎 unlikeDeck exception:", err)
    return { error: err instanceof Error ? err.message : "Unknown error" }
  }
}

export async function favoriteDeck(
  id: string,
  category = "posts",
  isDeckPage: boolean,
): Promise<{ error: string | null }> {
  console.log("⭐ favoriteDeck called with id:", id, "category:", category, "isDeckPage:", isDeckPage)

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      console.error("⭐ User not authenticated:", userError?.message)
      return { error: "ユーザーが認証されていません。" }
    }

    let insertError: any = null
    if (isDeckPage) {
      const { error } = await supabase.from("deck_favorites").insert({
        user_id: user.id,
        deck_page_id: id,
        category: category,
      })
      insertError = error
    } else {
      const { error } = await supabase.from("deck_favorites").insert({
        user_id: user.id,
        deck_id: id,
        category: category,
      })
      insertError = error
    }

    if (insertError) {
      if (insertError.code === "23505") {
        console.warn("⭐ Deck already favorited by this user:", id)
        return { error: null }
      }
      console.error("⭐ Insert into deck_favorites error:", insertError)
      return { error: insertError.message }
    }

    let rpcError: any = null
    if (isDeckPage) {
      console.log("⭐ Calling supabase.rpc('increment_deck_page_favorites') for deck_page")
      const { error } = await supabase.rpc("increment_deck_page_favorites", {
        deck_page_id_input: id,
      })
      rpcError = error
    } else {
      console.log("⭐ Calling supabase.rpc('increment_deck_favorites') for deck")
      const { error } = await supabase.rpc("increment_deck_favorites", {
        deck_id_input: id,
      })
      rpcError = error
    }

    if (rpcError) {
      console.error("⭐ RPC increment_favorites error:", rpcError)
      return { error: rpcError.message }
    }

    console.log("⭐ favoriteDeck successful")
    return { error: null }
  } catch (err) {
    console.error("⭐ favoriteDeck exception:", err)
    return { error: err instanceof Error ? err.message : "Unknown error" }
  }
}

export async function unfavoriteDeck(id: string, isDeckPage: boolean): Promise<{ error: string | null }> {
  console.log("⭐❌ unfavoriteDeck called with id:", id, "isDeckPage:", isDeckPage)

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      console.error("⭐❌ User not authenticated:", userError?.message)
      return { error: "ユーザーが認証されていません。" }
    }

    let deleteError: any = null
    if (isDeckPage) {
      const { error } = await supabase.from("deck_favorites").delete().eq("user_id", user.id).eq("deck_page_id", id)
      deleteError = error
    } else {
      const { error } = await supabase.from("deck_favorites").delete().eq("user_id", user.id).eq("deck_id", id)
      deleteError = error
    }

    if (deleteError) {
      console.error("⭐❌ Delete from deck_favorites error:", deleteError)
      return { error: deleteError.message }
    }

    let rpcError: any = null
    if (isDeckPage) {
      console.log("⭐❌ Calling supabase.rpc('decrement_deck_page_favorites') for deck_page")
      const { error } = await supabase.rpc("decrement_deck_page_favorites", {
        deck_page_id_input: id,
      })
      rpcError = error
    } else {
      console.log("⭐❌ Calling supabase.rpc('decrement_deck_favorites') for deck")
      const { error } = await supabase.rpc("decrement_deck_favorites", {
        deck_id_input: id,
      })
      rpcError = error
    }

    if (rpcError) {
      console.error("⭐❌ RPC decrement_favorites error:", rpcError)
      return { error: rpcError.message }
    }

    console.log("⭐❌ unfavoriteDeck successful")
    return { error: null }
  } catch (err) {
    console.error("⭐❌ unfavoriteDeck exception:", err)
    return { error: err instanceof Error ? err.message : "Unknown error" }
  }
}

export async function isFavorited(id: string, isDeckPage: boolean): Promise<boolean> {
  console.log("❓ isFavorited called with id:", id, "isDeckPage:", isDeckPage)
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      console.log("❓ User not logged in or error getting user:", userError?.message)
      return false
    }

    let query = supabase.from("deck_favorites").select("id").eq("user_id", user.id)
    if (isDeckPage) {
      query = query.eq("deck_page_id", id)
    } else {
      query = query.eq("deck_id", id)
    }

    const { data, error } = await query.single()

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

    const { data: favoriteEntries, error: fetchError } = await supabase
      .from("deck_favorites")
      .select("deck_id, deck_page_id, category")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (fetchError) {
      console.error("🌟 Error fetching favorite entries:", fetchError)
      return { data: [], error: fetchError.message }
    }

    const deckIds = favoriteEntries.map((entry) => entry.deck_id).filter(Boolean) as string[]
    const deckPageIds = favoriteEntries.map((entry) => entry.deck_page_id).filter(Boolean) as string[]

    let decksData: any[] = []
    let deckPagesData: any[] = []

    if (deckIds.length > 0) {
      const { data: fetchedDecks, error: decksError } = await supabase
        .from("decks")
        .select(
          `
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
        `,
        )
        .in("id", deckIds)
      if (decksError) console.error("🌟 Error fetching favorited decks:", decksError)
      else decksData = fetchedDecks
    }

    if (deckPageIds.length > 0) {
      const { data: fetchedDeckPages, error: deckPagesError } = await supabase
        .from("deck_pages")
        .select(
          `
          id,
          title,
          deck_name,
          thumbnail_image_url,
          updated_at,
          tier_rank,
          view_count,
          like_count,
          comment_count,
          favorite_count
        `,
        )
        .in("id", deckPageIds)
      if (deckPagesError) console.error("🌟 Error fetching favorited deck pages:", deckPagesError)
      else deckPagesData = fetchedDeckPages
    }

    const allDecksMap = new Map<string, any>()
    decksData.forEach((d) =>
      allDecksMap.set(d.id, {
        ...d,
        is_deck_page: false,
        deck_name: null,
        thumbnail_image_url: null,
        tier_rank: null,
      }),
    )
    deckPagesData.forEach((dp) =>
      allDecksMap.set(dp.id, {
        id: dp.id,
        title: dp.title || dp.deck_name || "無題のデッキ",
        description: null,
        user_id: null,
        is_public: true,
        tags: [],
        thumbnail_card_id: null,
        created_at: dp.updated_at,
        updated_at: dp.updated_at,
        like_count: dp.like_count || 0,
        favorite_count: dp.favorite_count || 0,
        view_count: dp.view_count || 0,
        comment_count: dp.comment_count || 0,
        deck_cards: [],
        thumbnail_image: dp.thumbnail_image_url
          ? {
              id: 0,
              name: dp.deck_name || dp.title || "無題のデッキ",
              image_url: dp.thumbnail_image_url,
              thumb_url: dp.thumbnail_image_url,
            }
          : null,
        is_deck_page: true,
        deck_name: dp.deck_name,
        thumbnail_image_url: dp.thumbnail_image_url,
        tier_rank: dp.tier_rank,
      }),
    )

    const formattedDecks: DeckWithCards[] = []
    const userIdsToFetch: string[] = []

    for (const entry of favoriteEntries) {
      const deckId = entry.deck_id || entry.deck_page_id
      if (allDecksMap.has(deckId)) {
        const deck = allDecksMap.get(deckId)
        formattedDecks.push({
          ...deck,
          source_tab: "お気に入り",
          category: entry.category,
        })
        if (deck.user_id && !userIdsToFetch.includes(deck.user_id)) {
          userIdsToFetch.push(deck.user_id)
        }
      }
    }

    const userDisplayNames: { [key: string]: string } = {}
    if (userIdsToFetch.length > 0) {
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("id, raw_user_meta_data")
        .in("id", userIdsToFetch)

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

    const finalFormattedDecks = formattedDecks.map((deck) => ({
      ...deck,
      user_display_name: deck.user_id ? userDisplayNames[deck.user_id] : null,
    }))

    console.log("🌟 getFavoriteDecks successful, returning:", finalFormattedDecks.length, "decks")
    return { data: finalFormattedDecks, error: null }
  } catch (err) {
    console.error("🌟 getFavoriteDecks exception:", err)
    return { data: [], error: err instanceof Error ? err.message : "Unknown error" }
  }
}
