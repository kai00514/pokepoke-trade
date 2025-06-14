"use server"

import { createClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"

// Supabaseクライアントを作成
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// デッキの型定義
export type Deck = {
  id: string
  user_id: string | null
  guest_name: string | null
  title: string
  description?: string
  is_public: boolean
  tags?: string[]
  thumbnail_card_id?: number
  created_at: string
  updated_at: string
}

// デッキカードの型定義
export type DeckCard = {
  card_id: number
  quantity: number
  name?: string
  image_url?: string
}

// デッキ作成の入力データ型
export type CreateDeckInput = {
  title: string
  user_id?: string | null
  guestName?: string
  description?: string
  is_public: boolean
  tags?: string[]
  deck_cards: DeckCard[]
  thumbnail_card_id?: number
  is_authenticated: boolean
}

// デッキ更新の入力データ型
export type UpdateDeckInput = {
  id: string
  title?: string
  description?: string
  is_public?: boolean
  tags?: string[]
  deck_cards?: DeckCard[]
  thumbnail_card_id?: number
}

/**
 * デッキを作成する
 */
export async function createDeck(input: CreateDeckInput): Promise<{ success: boolean; data?: Deck; error?: string }> {
  try {
    console.log("[createDeck] Starting deck creation with input:", {
      title: input.title,
      user_id: input.user_id,
      guestName: input.guestName,
      is_authenticated: input.is_authenticated,
      card_count: input.deck_cards.length,
      total_cards: input.deck_cards.reduce((sum, card) => sum + card.quantity, 0),
      thumbnail_card_id: input.thumbnail_card_id,
    })

    // カード枚数の検証
    const totalCards = input.deck_cards.reduce((sum, card) => sum + card.quantity, 0)
    if (totalCards !== 20) {
      throw new Error(`デッキはちょうど20枚である必要があります。(現在: ${totalCards}枚)`)
    }

    // 各カードの枚数制限チェック
    const invalidCards = input.deck_cards.filter((card) => card.quantity < 1 || card.quantity > 2)
    if (invalidCards.length > 0) {
      throw new Error("同じカードは1〜2枚までです。")
    }

    // 1. decksテーブルにデッキを作成
    const insertData: any = {
      title: input.title,
      description: input.description || null,
      is_public: input.is_public,
      tags: input.tags || [],
      thumbnail_card_id: input.thumbnail_card_id || null,
    }

    // Only set user_id if user is authenticated
    if (input.is_authenticated && input.user_id) {
      insertData.user_id = input.user_id
      insertData.guest_name = null
    } else {
      insertData.user_id = null
      insertData.guest_name = input.guestName || "ゲスト"
    }

    console.log("[createDeck] Insert data:", insertData)

    const { data: deckData, error: deckError } = await supabase.from("decks").insert(insertData).select().single()

    if (deckError) throw new Error(`デッキの作成に失敗しました: ${deckError.message}`)
    if (!deckData) throw new Error("デッキの作成に失敗しました: データが返されませんでした")

    console.log("[createDeck] Deck created successfully:", deckData.id)

    // 2. デッキカードを関連付け
    if (input.deck_cards.length > 0) {
      const deckCardsData = input.deck_cards.map((card) => ({
        deck_id: deckData.id,
        card_id: card.card_id,
        quantity: card.quantity,
      }))

      const { error: cardsError } = await supabase.from("deck_cards").insert(deckCardsData)

      if (cardsError) {
        // デッキカードの挿入に失敗した場合、作成したデッキを削除
        await supabase.from("decks").delete().eq("id", deckData.id)
        throw new Error(`デッキカードの関連付けに失敗しました: ${cardsError.message}`)
      }
    }

    // キャッシュを更新
    revalidatePath("/decks")

    return { success: true, data: deckData }
  } catch (error) {
    console.error("デッキ作成エラー:", error)
    return { success: false, error: error instanceof Error ? error.message : "デッキの作成に失敗しました" }
  }
}

/**
 * デッキの一覧を取得する
 */
export async function getDecksList(options?: {
  limit?: number
  offset?: number
  userId?: string
  isPublic?: boolean
}): Promise<{ success: boolean; data?: any[]; count?: number; error?: string }> {
  try {
    const limit = options?.limit || 20
    const offset = options?.offset || 0

    // 基本クエリを構築 - cardsテーブルとJOINしてサムネイル画像を取得
    let query = supabase.from("decks").select(
      `
        *,
        deck_cards (
          card_id,
          quantity
        ),
        thumbnail_card:cards!thumbnail_card_id (
          id,
          name,
          image_url,
          thumb_url
        )
      `,
      { count: "exact" },
    )

    // フィルタリング
    if (options?.userId) {
      query = query.eq("user_id", options.userId)
    }

    if (options?.isPublic !== undefined) {
      query = query.eq("is_public", options.isPublic)
    }

    // ソート、リミット、オフセットを適用
    query = query.order("created_at", { ascending: false }).range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) throw new Error(`デッキの取得に失敗しました: ${error.message}`)

    // データを整形してサムネイル情報を含める
    const formattedData = data?.map((deck) => ({
      ...deck,
      thumbnail_image: deck.thumbnail_card
        ? {
            id: deck.thumbnail_card.id,
            name: deck.thumbnail_card.name,
            image_url: deck.thumbnail_card.image_url,
            thumb_url: deck.thumbnail_card.thumb_url,
          }
        : null,
    }))

    return { success: true, data: formattedData, count }
  } catch (error) {
    console.error("デッキ一覧取得エラー:", error)
    return { success: false, error: error instanceof Error ? error.message : "デッキの取得に失敗しました" }
  }
}

/**
 * デッキの詳細を取得する
 */
export async function getDeckDetail(deckId: string): Promise<{
  success: boolean
  data?: {
    deck: any
    deck_cards: any[]
    thumbnail_image: any
  }
  error?: string
}> {
  try {
    // 1. デッキの基本情報を取得（cardsテーブルとJOIN）
    const { data: deck, error: deckError } = await supabase
      .from("decks")
      .select(`
        *,
        thumbnail_card:cards!thumbnail_card_id (
          id,
          name,
          image_url,
          thumb_url
        )
      `)
      .eq("id", deckId)
      .single()

    if (deckError) throw new Error(`デッキの取得に失敗しました: ${deckError.message}`)
    if (!deck) throw new Error("デッキが見つかりませんでした")

    // 2. デッキカード情報を取得
    const { data: deckCards, error: cardsError } = await supabase.from("deck_cards").select("*").eq("deck_id", deckId)

    if (cardsError) throw new Error(`デッキカード情報の取得に失敗しました: ${cardsError.message}`)

    // 3. サムネイル画像情報を整形
    const thumbnailImage = deck.thumbnail_card
      ? {
          id: deck.thumbnail_card.id,
          name: deck.thumbnail_card.name,
          image_url: deck.thumbnail_card.image_url,
          thumb_url: deck.thumbnail_card.thumb_url,
        }
      : null

    return {
      success: true,
      data: {
        deck,
        deck_cards: deckCards || [],
        thumbnail_image: thumbnailImage,
      },
    }
  } catch (error) {
    console.error("デッキ詳細取得エラー:", error)
    return { success: false, error: error instanceof Error ? error.message : "デッキ詳細の取得に失敗しました" }
  }
}

/**
 * デッキを更新する
 */
export async function updateDeck(input: UpdateDeckInput): Promise<{ success: boolean; data?: Deck; error?: string }> {
  try {
    // 1. デッキが存在するか確認
    const { data: existingDeck, error: checkError } = await supabase
      .from("decks")
      .select("*")
      .eq("id", input.id)
      .single()

    if (checkError) throw new Error(`デッキの確認に失敗しました: ${checkError.message}`)
    if (!existingDeck) throw new Error("更新対象のデッキが見つかりませんでした")

    // 2. デッキの基本情報を更新
    const updateData: any = {}
    if (input.title !== undefined) updateData.title = input.title
    if (input.description !== undefined) updateData.description = input.description
    if (input.is_public !== undefined) updateData.is_public = input.is_public
    if (input.tags !== undefined) updateData.tags = input.tags
    if (input.thumbnail_card_id !== undefined) updateData.thumbnail_card_id = input.thumbnail_card_id

    // 更新するデータがある場合のみ実行
    if (Object.keys(updateData).length > 0) {
      updateData.updated_at = new Date().toISOString()

      const { data: updatedDeck, error: updateError } = await supabase
        .from("decks")
        .update(updateData)
        .eq("id", input.id)
        .select()
        .single()

      if (updateError) throw new Error(`デッキの更新に失敗しました: ${updateError.message}`)
      if (!updatedDeck) throw new Error("デッキの更新に失敗しました: データが返されませんでした")

      // 3. デッキカードの更新（指定された場合のみ）
      if (input.deck_cards !== undefined) {
        // カード枚数の検証
        const totalCards = input.deck_cards.reduce((sum, card) => sum + card.quantity, 0)
        if (totalCards !== 20) {
          throw new Error(`デッキはちょうど20枚である必要があります。(現在: ${totalCards}枚)`)
        }

        // 既存のデッキカードを削除
        const { error: deleteError } = await supabase.from("deck_cards").delete().eq("deck_id", input.id)

        if (deleteError) throw new Error(`デッキカードの削除に失敗しました: ${deleteError.message}`)

        // 新しいデッキカードを追加
        if (input.deck_cards.length > 0) {
          const deckCardsData = input.deck_cards.map((card) => ({
            deck_id: input.id,
            card_id: card.card_id,
            quantity: card.quantity,
          }))

          const { error: insertError } = await supabase.from("deck_cards").insert(deckCardsData)

          if (insertError) throw new Error(`デッキカードの追加に失敗しました: ${insertError.message}`)
        }
      }

      // キャッシュを更新
      revalidatePath("/decks")
      revalidatePath(`/decks/${input.id}`)

      return { success: true, data: updatedDeck }
    }

    return { success: true, data: existingDeck }
  } catch (error) {
    console.error("デッキ更新エラー:", error)
    return { success: false, error: error instanceof Error ? error.message : "デッキの更新に失敗しました" }
  }
}

/**
 * デッキを削除する
 */
export async function deleteDeck(deckId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // デッキを削除（関連するレコードは外部キー制約のON DELETE CASCADEで自動的に削除される）
    const { error } = await supabase.from("decks").delete().eq("id", deckId)

    if (error) throw new Error(`デッキの削除に失敗しました: ${error.message}`)

    // キャッシュを更新
    revalidatePath("/decks")

    return { success: true }
  } catch (error) {
    console.error("デッキ削除エラー:", error)
    return { success: false, error: error instanceof Error ? error.message : "デッキの削除に失敗しました" }
  }
}

/**
 * 自分のデッキ一覧を取得する
 */
export async function getMyDecks(
  userId: string,
  options?: {
    limit?: number
    offset?: number
    isPublic?: boolean
  },
): Promise<{ success: boolean; data?: any[]; count?: number; error?: string }> {
  try {
    const limit = options?.limit || 20
    const offset = options?.offset || 0

    let query = supabase
      .from("decks")
      .select(
        `
        *,
        deck_cards (
          card_id,
          quantity
        ),
        thumbnail_card:cards!thumbnail_card_id (
          id,
          name,
          image_url,
          thumb_url
        )
      `,
        { count: "exact" },
      )
      .eq("user_id", userId)

    if (options?.isPublic !== undefined) {
      query = query.eq("is_public", options.isPublic)
    }

    // ソート、リミット、オフセットを適用
    query = query.order("created_at", { ascending: false }).range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) throw new Error(`自分のデッキの取得に失敗しました: ${error.message}`)

    // データを整形してサムネイル情報を含める
    const formattedData = data?.map((deck) => ({
      ...deck,
      thumbnail_image: deck.thumbnail_card
        ? {
            id: deck.thumbnail_card.id,
            name: deck.thumbnail_card.name,
            image_url: deck.thumbnail_card.image_url,
            thumb_url: deck.thumbnail_card.thumb_url,
          }
        : null,
    }))

    return { success: true, data: formattedData, count }
  } catch (error) {
    console.error("自分のデッキ一覧取得エラー:", error)
    return { success: false, error: error instanceof Error ? error.message : "自分のデッキの取得に失敗しました" }
  }
}
