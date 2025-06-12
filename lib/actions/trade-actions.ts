"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { v4 as uuidv4 } from "uuid"
import type { Card } from "@/components/detailed-search-modal"

export interface TradeFormData {
  title: string
  wantedCards: Card[]
  offeredCards: Card[]
  appId?: string
  comment?: string
}

export async function createTradePost(formData: TradeFormData) {
  try {
    const supabase = await createServerClient()

    // 認証状態を確認
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return {
        success: false,
        error: "認証が必要です。ログインしてください。",
      }
    }

    // バリデーション
    if (!formData.title.trim()) {
      return {
        success: false,
        error: "タイトルを入力してください。",
      }
    }

    if (formData.wantedCards.length === 0) {
      return {
        success: false,
        error: "求めるカードを少なくとも1枚選択してください。",
      }
    }

    if (formData.offeredCards.length === 0) {
      return {
        success: false,
        error: "譲れるカードを少なくとも1枚選択してください。",
      }
    }

    // トランザクションを使用して複数テーブルに保存
    const postId = uuidv4()
    const userId = session.user.id

    // メインの投稿を保存
    const { error: postError } = await supabase.from("trade_posts").insert({
      id: postId,
      title: formData.title,
      owner_id: userId,
      custom_id: formData.appId || null,
      comment: formData.comment || null,
      want_card_id: formData.wantedCards[0]?.id ? Number.parseInt(formData.wantedCards[0].id) : null,
      status: "OPEN",
      is_authenticated: true,
    })

    if (postError) {
      console.error("Error creating trade post:", postError)
      return {
        success: false,
        error: "投稿の作成に失敗しました。",
      }
    }

    // 求めるカードを保存
    const wantedCardsData = formData.wantedCards.map((card, index) => ({
      post_id: postId,
      card_id: Number.parseInt(card.id),
      is_primary: index === 0, // 最初のカードをプライマリとして設定
    }))

    const { error: wantedCardsError } = await supabase.from("trade_post_wanted_cards").insert(wantedCardsData)

    if (wantedCardsError) {
      console.error("Error adding wanted cards:", wantedCardsError)
      return {
        success: false,
        error: "求めるカードの保存に失敗しました。",
      }
    }

    // 譲れるカードを保存
    const offeredCardsData = formData.offeredCards.map((card) => ({
      post_id: postId,
      card_id: Number.parseInt(card.id),
    }))

    const { error: offeredCardsError } = await supabase.from("trade_post_offered_cards").insert(offeredCardsData)

    if (offeredCardsError) {
      console.error("Error adding offered cards:", offeredCardsError)
      return {
        success: false,
        error: "譲れるカードの保存に失敗しました。",
      }
    }

    // キャッシュを更新してホームページをリフレッシュ
    revalidatePath("/")

    return {
      success: true,
      postId,
    }
  } catch (error) {
    console.error("Unexpected error creating trade post:", error)
    return {
      success: false,
      error: "予期しないエラーが発生しました。",
    }
  }
}

export async function getTradePostsWithCards(limit = 10, offset = 0) {
  try {
    const supabase = await createServerClient()

    // メインの投稿を取得
    const { data: posts, error: postsError } = await supabase
      .from("trade_posts")
      .select("*")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (postsError) {
      console.error("Error fetching trade posts:", postsError)
      return {
        success: false,
        error: "投稿の取得に失敗しました。",
        posts: [],
      }
    }

    // 各投稿のカード情報を取得
    const postsWithCards = await Promise.all(
      posts.map(async (post) => {
        // 求めるカード情報を取得
        const { data: wantedCardsRelations, error: wantedError } = await supabase
          .from("trade_post_wanted_cards")
          .select("card_id, is_primary")
          .eq("post_id", post.id)

        if (wantedError) {
          console.error(`Error fetching wanted cards for post ${post.id}:`, wantedError)
          return { ...post, wantedCards: [], offeredCards: [] }
        }

        // 譲れるカード情報を取得
        const { data: offeredCardsRelations, error: offeredError } = await supabase
          .from("trade_post_offered_cards")
          .select("card_id")
          .eq("post_id", post.id)

        if (offeredError) {
          console.error(`Error fetching offered cards for post ${post.id}:`, offeredError)
          return { ...post, wantedCards: [], offeredCards: [] }
        }

        // カードIDのリストを作成
        const wantedCardIds = wantedCardsRelations.map((relation) => relation.card_id)
        const offeredCardIds = offeredCardsRelations.map((relation) => relation.card_id)
        const allCardIds = [...wantedCardIds, ...offeredCardIds]

        // カード情報を一括取得
        const { data: cardsData, error: cardsError } = await supabase
          .from("cards")
          .select("id, name, image_url")
          .in("id", allCardIds)

        if (cardsError) {
          console.error(`Error fetching cards data for post ${post.id}:`, cardsError)
          return { ...post, wantedCards: [], offeredCards: [] }
        }

        // カードIDとカード情報のマッピングを作成
        const cardsMap = new Map(cardsData.map((card) => [card.id, card]))

        // 求めるカードと譲れるカードの情報を組み立て
        const wantedCards = wantedCardsRelations
          .map((relation) => {
            const card = cardsMap.get(relation.card_id)
            return card
              ? {
                  ...card,
                  isPrimary: relation.is_primary,
                }
              : null
          })
          .filter(Boolean)

        const offeredCards = offeredCardsRelations
          .map((relation) => {
            const card = cardsMap.get(relation.card_id)
            return card ? { ...card } : null
          })
          .filter(Boolean)

        // コメント数を取得
        const { count: commentCount, error: commentError } = await supabase
          .from("trade_comments")
          .select("id", { count: true })
          .eq("post_id", post.id)
          .eq("is_deleted", false)

        if (commentError) {
          console.error(`Error fetching comment count for post ${post.id}:`, commentError)
        }

        // 投稿者情報を取得
        const { data: userData, error: userError } = await supabase
          .from("profiles")
          .select("username, avatar_url")
          .eq("id", post.owner_id)
          .single()

        let username = "ユーザー"
        let avatarUrl = null

        if (!userError && userData) {
          username = userData.username || "ユーザー"
          avatarUrl = userData.avatar_url
        }

        // 日付をフォーマット
        const createdAt = new Date(post.created_at)
        const formattedDate = `${createdAt.getFullYear()}/${String(createdAt.getMonth() + 1).padStart(
          2,
          "0",
        )}/${String(createdAt.getDate()).padStart(2, "0")}`

        // 投稿データを整形して返す
        return {
          id: post.id,
          title: post.title,
          date: formattedDate,
          status:
            post.status === "OPEN"
              ? "募集中"
              : post.status === "MATCHED"
                ? "進行中"
                : post.status === "COMPLETED"
                  ? "完了"
                  : "キャンセル",
          wantedCard: {
            name: wantedCards.find((card) => card.isPrimary)?.name || wantedCards[0]?.name || "不明",
            image:
              wantedCards.find((card) => card.isPrimary)?.image_url || wantedCards[0]?.image_url || "/placeholder.svg",
          },
          offeredCard: {
            name: offeredCards[0]?.name || "不明",
            image: offeredCards[0]?.image_url || "/placeholder.svg",
          },
          comments: commentCount || 0,
          postId: post.custom_id || post.id.substring(0, 8),
          username,
          avatarUrl,
          rawData: {
            wantedCards,
            offeredCards,
          },
        }
      }),
    )

    return {
      success: true,
      posts: postsWithCards,
    }
  } catch (error) {
    console.error("Unexpected error fetching trade posts:", error)
    return {
      success: false,
      error: "予期しないエラーが発生しました。",
      posts: [],
    }
  }
}
