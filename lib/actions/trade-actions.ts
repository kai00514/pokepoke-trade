"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { v4 as uuidv4 } from "uuid"
import type { Card } from "@/components/detailed-search-modal"
import type { User } from "@supabase/supabase-js" // Userタイプをインポート

export interface TradeFormData {
  title: string
  wantedCards: Card[]
  offeredCards: Card[]
  appId?: string
  comment?: string
}

// Helper function to extract username and avatar
function getUserProfileData(user: User | null | undefined) {
  const username =
    user?.user_metadata?.username || user?.user_metadata?.name || user?.email?.split("@")[0] || "ユーザー"
  const avatarUrl = user?.user_metadata?.avatar_url || null
  return { username, avatarUrl }
}

export async function createTradePost(formData: TradeFormData) {
  try {
    const supabase = await createServerClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return { success: false, error: "認証が必要です。ログインしてください。" }
    }

    if (!formData.title.trim()) {
      return { success: false, error: "タイトルを入力してください。" }
    }
    if (formData.wantedCards.length === 0) {
      return { success: false, error: "求めるカードを少なくとも1枚選択してください。" }
    }
    if (formData.offeredCards.length === 0) {
      return { success: false, error: "譲れるカードを少なくとも1枚選択してください。" }
    }

    const postId = uuidv4()
    const userId = session.user.id

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
      return { success: false, error: `投稿の作成に失敗しました: ${postError.message}` }
    }

    const wantedCardsData = formData.wantedCards.map((card, index) => ({
      post_id: postId,
      card_id: Number.parseInt(card.id),
      is_primary: index === 0,
    }))
    const { error: wantedCardsError } = await supabase.from("trade_post_wanted_cards").insert(wantedCardsData)
    if (wantedCardsError) {
      console.error("Error adding wanted cards:", wantedCardsError)
      return { success: false, error: `求めるカードの保存に失敗しました: ${wantedCardsError.message}` }
    }

    const offeredCardsData = formData.offeredCards.map((card) => ({
      post_id: postId,
      card_id: Number.parseInt(card.id),
    }))
    const { error: offeredCardsError } = await supabase.from("trade_post_offered_cards").insert(offeredCardsData)
    if (offeredCardsError) {
      console.error("Error adding offered cards:", offeredCardsError)
      return { success: false, error: `譲れるカードの保存に失敗しました: ${offeredCardsError.message}` }
    }

    revalidatePath("/")
    return { success: true, postId }
  } catch (error) {
    console.error("Unexpected error creating trade post:", error)
    const errorMessage = error instanceof Error ? error.message : "予期しないエラーが発生しました。"
    return { success: false, error: errorMessage }
  }
}

export async function getTradePostsWithCards(limit = 10, offset = 0) {
  try {
    const supabase = await createServerClient()

    const { data: posts, error: postsError } = await supabase
      .from("trade_posts")
      .select("id, title, owner_id, custom_id, status, created_at")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (postsError) {
      console.error("Error fetching trade posts:", postsError)
      return { success: false, error: `投稿の取得に失敗しました: ${postsError.message}`, posts: [] }
    }

    if (!posts || posts.length === 0) {
      return { success: true, posts: [] }
    }

    const postIds = posts.map((post) => post.id)
    const ownerIds = Array.from(new Set(posts.map((post) => post.owner_id).filter(Boolean)))

    const usersMap = new Map<string, User>()
    if (ownerIds.length > 0) {
      // Fetch users one by one - potential N+1 issue.
      // For a large number of unique owners, consider an RPC or a different strategy.
      for (const ownerId of ownerIds) {
        if (ownerId) {
          const { data: userData, error: userError } = await supabase.auth.admin.getUserById(ownerId)
          if (userError) {
            console.error(`Error fetching user ${ownerId}:`, userError.message)
          } else if (userData?.user) {
            usersMap.set(ownerId, userData.user)
          }
        }
      }
    }

    const { data: wantedRelations, error: wantedError } = await supabase
      .from("trade_post_wanted_cards")
      .select("post_id, card_id, is_primary")
      .in("post_id", postIds)

    if (wantedError) {
      console.error("Error fetching wanted card relations:", wantedError)
      return { success: false, error: `求めるカード関連の取得に失敗: ${wantedError.message}`, posts: [] }
    }

    const { data: offeredRelations, error: offeredError } = await supabase
      .from("trade_post_offered_cards")
      .select("post_id, card_id")
      .in("post_id", postIds)

    if (offeredError) {
      console.error("Error fetching offered card relations:", offeredError)
      return { success: false, error: `譲れるカード関連の取得に失敗: ${offeredError.message}`, posts: [] }
    }

    const allCardIds = new Set<number>()
    wantedRelations?.forEach((r) => allCardIds.add(r.card_id))
    offeredRelations?.forEach((r) => allCardIds.add(r.card_id))

    const cardsMap = new Map<number, { id: string; name: string; image_url: string }>()
    if (allCardIds.size > 0) {
      const { data: cardDetails, error: cardsError } = await supabase
        .from("cards")
        .select("id, name, image_url")
        .in("id", Array.from(allCardIds))

      if (cardsError) {
        console.error("Error fetching card details:", cardsError)
      } else {
        cardDetails?.forEach((c) => cardsMap.set(c.id, { ...c, id: c.id.toString() }))
      }
    }

    const commentCountsMap = new Map<string, number>()
    try {
      const { data: allCommentsForPosts, error: commentFetchError } = await supabase
        .from("trade_comments")
        .select("post_id")
        .in("post_id", postIds)
        .eq("is_deleted", false)

      if (commentFetchError) {
        if (
          commentFetchError.message.includes("Too Many Requests") ||
          commentFetchError.message.includes("rate limit")
        ) {
          console.warn("Rate limit hit fetching comments for counting. Skipping comment counts.")
        } else {
          console.error("Error fetching comments for counting:", commentFetchError)
        }
      } else {
        allCommentsForPosts?.forEach((comment) => {
          commentCountsMap.set(comment.post_id, (commentCountsMap.get(comment.post_id) || 0) + 1)
        })
      }
    } catch (e) {
      console.error("Unexpected error during comment fetching/counting:", e)
    }

    const postsWithCards = posts.map((post) => {
      const ownerUser = post.owner_id ? usersMap.get(post.owner_id) : null
      const { username, avatarUrl } = getUserProfileData(ownerUser)

      const createdAt = new Date(post.created_at)
      const formattedDate = `${createdAt.getFullYear()}/${String(createdAt.getMonth() + 1).padStart(
        2,
        "0",
      )}/${String(createdAt.getDate()).padStart(2, "0")}`

      const currentWantedCards =
        wantedRelations
          ?.filter((r) => r.post_id === post.id)
          .map((r) => {
            const card = cardsMap.get(r.card_id)
            return {
              id: card?.id || r.card_id.toString(),
              name: card?.name || "不明",
              imageUrl: card?.image_url || "/placeholder.svg?width=80&height=112",
              isPrimary: r.is_primary,
            }
          }) || []

      const currentOfferedCards =
        offeredRelations
          ?.filter((r) => r.post_id === post.id)
          .map((r) => {
            const card = cardsMap.get(r.card_id)
            return {
              id: card?.id || r.card_id.toString(),
              name: card?.name || "不明",
              imageUrl: card?.image_url || "/placeholder.svg?width=80&height=112",
            }
          }) || []

      const primaryWantedCard = currentWantedCards.find((c) => c.isPrimary) || currentWantedCards[0]
      const primaryOfferedCard = currentOfferedCards[0]

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
          name: primaryWantedCard?.name || "不明",
          image: primaryWantedCard?.imageUrl || "/placeholder.svg?width=100&height=140",
        },
        offeredCard: {
          name: primaryOfferedCard?.name || "不明",
          image: primaryOfferedCard?.imageUrl || "/placeholder.svg?width=100&height=140",
        },
        comments: commentCountsMap.get(post.id) || 0,
        postId: post.custom_id || post.id.substring(0, 8),
        username,
        avatarUrl,
        rawData: {
          wantedCards: currentWantedCards,
          offeredCards: currentOfferedCards,
        },
      }
    })

    return { success: true, posts: postsWithCards }
  } catch (error) {
    console.error("Unexpected error fetching trade posts (outer try-catch):", error)
    const errorMessage = error instanceof Error ? error.message : "予期しないエラーが発生しました。"
    if (error instanceof SyntaxError && error.message.includes("Too Many R")) {
      return {
        success: false,
        error: "サーバーが混み合っています。しばらくしてから再度お試しください。(Rate Limit)",
        posts: [],
      }
    }
    return { success: false, error: errorMessage, posts: [] }
  }
}

export async function getTradePostDetailsById(postId: string) {
  try {
    const supabase = await createServerClient()

    const { data: postData, error: postError } = await supabase
      .from("trade_posts")
      .select(
        `*, 
        trade_post_wanted_cards ( card_id, is_primary, cards (id, name, image_url) ), 
        trade_post_offered_cards ( card_id, cards (id, name, image_url) )`,
      )
      .eq("id", postId)
      .single()

    if (postError || !postData) {
      console.error(`Error fetching post details for ${postId}:`, postError)
      return {
        success: false,
        error: `投稿詳細の取得に失敗しました: ${postError?.message || "投稿が見つかりません"}`,
        post: null,
      }
    }

    let authorInfo = { username: "ユーザー", avatarUrl: null }
    if (postData.owner_id) {
      const { data: userData, error: userError } = await supabase.auth.admin.getUserById(postData.owner_id)
      if (userError) {
        console.error(`Error fetching author ${postData.owner_id} for post ${postId}:`, userError.message)
      } else if (userData?.user) {
        authorInfo = getUserProfileData(userData.user)
      }
    }

    const wantedCards = postData.trade_post_wanted_cards.map((wc: any) => ({
      id: wc.cards.id.toString(),
      name: wc.cards.name,
      imageUrl: wc.cards.image_url,
      isPrimary: wc.is_primary,
    }))
    const offeredCards = postData.trade_post_offered_cards.map((oc: any) => ({
      id: oc.cards.id.toString(),
      name: oc.cards.name,
      imageUrl: oc.cards.image_url,
    }))

    const { data: commentsData, error: commentsError } = await supabase
      .from("trade_comments")
      .select("id, user_id, user_name, content, created_at") // user_id for potential future avatar lookup
      .eq("post_id", postId)
      .eq("is_deleted", false)
      .order("created_at", { ascending: true })

    if (commentsError) {
      console.error(`Error fetching comments for post ${postId}:`, commentsError)
    }

    // If you need comment author avatars from auth.users, you'd fetch them similarly to post authors
    // For now, using user_name stored in trade_comments
    const comments =
      commentsData?.map((comment: any) => {
        const createdAt = new Date(comment.created_at)
        const diffSeconds = Math.floor((Date.now() - createdAt.getTime()) / 1000)
        let timestamp = `${createdAt.toLocaleDateString()}`
        if (diffSeconds < 60) timestamp = `${diffSeconds}秒前`
        else if (diffSeconds < 3600) timestamp = `${Math.floor(diffSeconds / 60)}分前`
        else if (diffSeconds < 86400) timestamp = `${Math.floor(diffSeconds / 3600)}時間前`
        else if (diffSeconds < 2592000) timestamp = `${Math.floor(diffSeconds / 86400)}日前`

        return {
          id: comment.id,
          author: comment.user_name || "ゲスト", // Using denormalized user_name
          avatar: null, // Placeholder. Fetch if needed via comment.user_id and supabase.auth.admin.getUserById
          text: comment.content,
          timestamp: timestamp,
        }
      }) || []

    const formattedPost = {
      id: postData.id,
      title: postData.title,
      status:
        postData.status === "OPEN"
          ? "募集中"
          : postData.status === "MATCHED"
            ? "進行中"
            : postData.status === "COMPLETED"
              ? "完了"
              : "キャンセル",
      wantedCards,
      offeredCards,
      description: postData.comment || "",
      authorNotes: null,
      originalPostId: postData.custom_id || postData.id.substring(0, 8),
      comments,
      author: authorInfo,
      createdAt: new Date(postData.created_at).toLocaleDateString(),
    }

    return { success: true, post: formattedPost }
  } catch (error) {
    console.error(`Unexpected error fetching post details for ${postId}:`, error)
    const errorMessage = error instanceof Error ? error.message : "予期しないエラーが発生しました。"
    return { success: false, error: errorMessage, post: null }
  }
}

export async function addCommentToTradePost(postId: string, content: string) {
  try {
    const supabase = await createServerClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return { success: false, error: "コメントするにはログインが必要です。" }
    }
    if (!content.trim()) {
      return { success: false, error: "コメント内容を入力してください。" }
    }

    // Get username from session user_metadata
    const { username } = getUserProfileData(session.user)

    const { error } = await supabase.from("trade_comments").insert({
      post_id: postId,
      user_id: session.user.id,
      user_name: username, // Use username from session
      content: content,
      is_guest: false,
    })

    if (error) {
      console.error("Error adding comment:", error)
      return { success: false, error: `コメントの投稿に失敗しました: ${error.message}` }
    }

    revalidatePath(`/trades/${postId}`)
    return { success: true }
  } catch (error) {
    console.error("Unexpected error adding comment:", error)
    const errorMessage = error instanceof Error ? error.message : "予期しないエラーが発生しました。"
    return { success: false, error: errorMessage }
  }
}
