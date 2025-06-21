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
  // deck_pagesからのデータの場合に備えて追加
  is_deck_page?: boolean
  deck_name?: string
  thumbnail_image_url?: string
  tier_rank?: number
  view_count?: number
  like_count?: number
  comment_count?: number
  favorite_count?: number
  category?: string // categoryプロパティを追加
  source_tab?: string // どのタブから来たかを示すプロパティを追加
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

export async function likeDeck(id: string, isDeckPage = false): Promise<{ error: string | null }> {
  console.log("👍 likeDeck called with id:", id, "isDeckPage:", isDeckPage)
  console.log("👍 Supabase client:", supabase)

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
  console.log("👎 Supabase client:", supabase)

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

    let insertError: any = null
    if (isDeckPage) {
      // deck_favoritesテーブルにdeck_page_idで挿入
      const { error } = await supabase.from("deck_favorites").insert({
        user_id: user.id,
        deck_page_id: id,
        category: category,
      })
      insertError = error
    } else {
      // deck_favoritesテーブルにdeck_idで挿入
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
        return { error: null } // 既に存在する場合はエラーとしない
      }
      console.error("⭐ Insert into deck_favorites error:", insertError)
      return { error: insertError.message }
    }

    // RPCを呼び出してカウントを更新
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

    let deleteError: any = null
    if (isDeckPage) {
      // deck_favoritesテーブルからdeck_page_idで削除
      const { error } = await supabase.from("deck_favorites").delete().eq("user_id", user.id).eq("deck_page_id", id)
      deleteError = error
    } else {
      // deck_favoritesテーブルからdeck_idで削除
      const { error } = await supabase.from("deck_favorites").delete().eq("user_id", user.id).eq("deck_id", id)
      deleteError = error
    }

    if (deleteError) {
      console.error("⭐❌ Delete from deck_favorites error:", deleteError)
      return { error: deleteError.message }
    }

    // RPCを呼び出してカウントを更新
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
    console.log("🌟 Fetched favorite entries:", favoriteEntries) // デバッグログ

    const deckIds = favoriteEntries.map((entry) => entry.deck_id).filter(Boolean) as string[]
    const deckPageIds = favoriteEntries.map((entry) => entry.deck_page_id).filter(Boolean) as string[]
    console.log("🌟 Extracted deckIds:", deckIds) // デバッグログ
    console.log("🌟 Extracted deckPageIds:", deckPageIds) // デバッグログ

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
      console.log("🌟 Fetched decksData:", decksData) // デバッグログ
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
          favorite_count,
          category // ここにcategoryカラムを追加
        `,
        )
        .in("id", deckPageIds)
      if (deckPagesError) console.error("🌟 Error fetching favorited deck pages:", deckPagesError)
      else deckPagesData = fetchedDeckPages
      console.log("🌟 Fetched deckPagesData:", fetchedDeckPages) // デバッグログ
    }

    const allDecksMap = new Map<string, any>()
    decksData.forEach((d) =>
      allDecksMap.set(d.id, {
        ...d,
        is_deck_page: false,
        // deck_pagesにないプロパティをnullで初期化
        deck_name: null,
        thumbnail_image_url: null,
        tier_rank: null,
        category: "投稿", // decksテーブルのデータは「投稿」カテゴリとする
      }),
    )
    deckPagesData.forEach((dp) =>
      allDecksMap.set(dp.id, {
        id: dp.id, // UUIDのまま
        title: dp.title || dp.deck_name || "無題のデッキ",
        description: null, // deck_pagesにはdescriptionがないため
        user_id: null, // deck_pagesにはuser_idがないため
        is_public: true, // deck_pagesは公開を前提
        tags: [], // deck_pagesにはtagsがないため
        thumbnail_card_id: null, // deck_pagesにはthumbnail_card_idがないため
        created_at: dp.updated_at, // deck_pagesにはcreated_atがないためupdated_atを使用
        updated_at: dp.updated_at,
        like_count: dp.like_count || 0,
        favorite_count: dp.favorite_count || 0,
        view_count: dp.view_count || 0,
        comment_count: dp.comment_count || 0,
        deck_cards: [], // deck_pagesにはdeck_cardsがないため
        thumbnail_image: dp.thumbnail_image_url
          ? {
              id: 0, // ダミーID
              name: dp.deck_name || dp.title || "無題のデッキ",
              image_url: dp.thumbnail_image_url,
              thumb_url: dp.thumbnail_image_url,
            }
          : null,
        is_deck_page: true,
        deck_name: dp.deck_name,
        thumbnail_image_url: dp.thumbnail_image_url,
        tier_rank: dp.tier_rank,
        category: dp.category, // deck_pagesのcategoryをそのまま使用
      }),
    )
    console.log("🌟 allDecksMap size:", allDecksMap.size) // デバッグログ
    console.log("🌟 allDecksMap content (first 5):", Array.from(allDecksMap.entries()).slice(0, 5)) // デバッグログ

    // Reconstruct the list in the original favorite order
    const formattedDecks: DeckWithCards[] = []
    const userIdsToFetch: string[] = []

    for (const entry of favoriteEntries) {
      const deckId = entry.deck_id || entry.deck_page_id
      if (allDecksMap.has(deckId)) {
        const deck = allDecksMap.get(deckId)
        formattedDecks.push({
          ...deck,
          source_tab: "お気に入り", // Ensure this is set for favorites page
          category: deck.category, // allDecksMapから取得したcategoryを使用
        })
        if (deck.user_id && !userIdsToFetch.includes(deck.user_id)) {
          userIdsToFetch.push(deck.user_id)
        }
      } else {
        console.warn("🌟 Deck not found in allDecksMap for favorite entry:", deckId, entry) // デバッグログ
      }
    }

    // Fetch user display names
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

    // Add user_display_name to formattedDecks
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
