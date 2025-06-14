"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { v4 as uuidv4 } from "uuid"
import type { Card } from "@/components/detailed-search-modal"

// Helper function to extract username and avatar from auth user
function getUserDisplayInfo(user: any) {
  const username =
    user?.user_metadata?.username ||
    user?.user_metadata?.name ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "ユーザー"
  const avatarUrl = user?.user_metadata?.avatar_url || null
  return { username, avatarUrl }
}

export interface TradeFormData {
  title: string
  wantedCards: Card[]
  offeredCards: Card[]
  appId?: string
  comment?: string
  guestName?: string
}

export async function createTradePost(formData: TradeFormData) {
  try {
    const supabase = await createServerClient()

    // Get current session with detailed logging
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    console.log("[createTradePost] Session check:", {
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id,
      sessionError: sessionError?.message,
    })

    if (sessionError) {
      console.warn("[createTradePost] Session error (continuing as guest):", sessionError)
    }

    const userId = session?.user?.id || null
    const isAuthenticated = !!session?.user && !!userId
    const guestName = formData.guestName?.trim() || "ゲスト"

    console.log("[createTradePost] Authentication status:", {
      userId,
      isAuthenticated,
      guestName: isAuthenticated ? null : guestName,
    })

    const postId = uuidv4()

    // Prepare insert data based on authentication status
    let insertData: any

    if (isAuthenticated && userId) {
      // Authenticated user post
      insertData = {
        id: postId,
        title: formData.title.trim(),
        owner_id: userId, // Explicitly set owner_id for authenticated users
        guest_name: null, // No guest name for authenticated users
        custom_id: formData.appId?.trim() || null,
        comment: formData.comment?.trim() || null,
        want_card_id: formData.wantedCards[0]?.id ? Number.parseInt(formData.wantedCards[0].id) : null,
        status: "OPEN",
        is_authenticated: true, // Explicitly set to true
      }
    } else {
      // Guest user post
      insertData = {
        id: postId,
        title: formData.title.trim(),
        owner_id: null, // Explicitly set to null for guest users
        guest_name: guestName, // Set guest name
        custom_id: formData.appId?.trim() || null,
        comment: formData.comment?.trim() || null,
        want_card_id: formData.wantedCards[0]?.id ? Number.parseInt(formData.wantedCards[0].id) : null,
        status: "OPEN",
        is_authenticated: false, // Explicitly set to false
      }
    }

    console.log("[createTradePost] Final insert data:", insertData)

    // Step 1: Insert main trade post
    const { data: insertResult, error: postError } = await supabase.from("trade_posts").insert(insertData).select()

    if (postError) {
      console.error("[createTradePost] Post insert error:", postError)
      return {
        success: false,
        error: `投稿の作成に失敗しました: ${postError.message}`,
        details: postError,
      }
    }

    console.log("[createTradePost] Trade post created successfully:", insertResult)

    // Step 2: Insert wanted cards
    if (formData.wantedCards.length > 0) {
      const wantedCardsData = formData.wantedCards.map((card, index) => ({
        post_id: postId,
        card_id: Number.parseInt(card.id),
        is_primary: index === 0, // First card is primary
      }))

      console.log("[createTradePost] Inserting wanted cards:", wantedCardsData)

      const { error: wantedCardsError } = await supabase.from("trade_post_wanted_cards").insert(wantedCardsData)

      if (wantedCardsError) {
        console.error("[createTradePost] Wanted cards error:", wantedCardsError)
        // Cleanup: delete the main post
        await supabase.from("trade_posts").delete().eq("id", postId)
        return {
          success: false,
          error: `求めるカードの保存に失敗しました: ${wantedCardsError.message}`,
          details: wantedCardsError,
        }
      }
    }

    // Step 3: Insert offered cards
    if (formData.offeredCards.length > 0) {
      const offeredCardsData = formData.offeredCards.map((card) => ({
        post_id: postId,
        card_id: Number.parseInt(card.id),
      }))

      console.log("[createTradePost] Inserting offered cards:", offeredCardsData)

      const { error: offeredCardsError } = await supabase.from("trade_post_offered_cards").insert(offeredCardsData)

      if (offeredCardsError) {
        console.error("[createTradePost] Offered cards error:", offeredCardsError)
        // Cleanup: delete related records
        await supabase.from("trade_post_wanted_cards").delete().eq("post_id", postId)
        await supabase.from("trade_posts").delete().eq("id", postId)
        return {
          success: false,
          error: `譲れるカードの保存に失敗しました: ${offeredCardsError.message}`,
          details: offeredCardsError,
        }
      }
    }

    // Revalidate the path to refresh the data
    revalidatePath("/")

    console.log("[createTradePost] Successfully created trade post with ID:", postId)
    return { success: true, postId }
  } catch (error) {
    console.error("[createTradePost] Unexpected error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "予期しないエラーが発生しました。",
      details: error,
    }
  }
}

export async function getTradePostsWithCards(limit = 10, offset = 0) {
  try {
    const supabase = await createServerClient()

    // Get posts with basic information first
    const { data: posts, error: postsError } = await supabase
      .from("trade_posts")
      .select(`
        id, 
        title, 
        owner_id, 
        guest_name,
        custom_id, 
        status, 
        created_at,
        is_authenticated
      `)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (postsError) {
      console.error("Error fetching trade posts:", postsError)
      return { success: false, error: `投稿の取得に失敗しました: ${postsError.message}`, posts: [] }
    }

    if (!posts || posts.length === 0) {
      return { success: true, posts: [] }
    }

    // Get auth users for authenticated posts
    const authenticatedPosts = posts.filter((post) => post.is_authenticated && post.owner_id)
    const userIds = authenticatedPosts.map((post) => post.owner_id)

    const authUsersMap = new Map()
    if (userIds.length > 0) {
      const { data: authUsers, error: usersError } = await supabase.auth.admin.listUsers()

      if (!usersError && authUsers?.users) {
        authUsers.users.forEach((user) => {
          if (userIds.includes(user.id)) {
            const { username, avatarUrl } = getUserDisplayInfo(user)
            authUsersMap.set(user.id, { username, avatarUrl })
          }
        })
      }
    }

    const postIds = posts.map((post) => post.id)

    // Get wanted cards relations
    const { data: wantedRelations, error: wantedError } = await supabase
      .from("trade_post_wanted_cards")
      .select("post_id, card_id, is_primary")
      .in("post_id", postIds)

    if (wantedError) {
      console.error("Error fetching wanted card relations:", wantedError)
      return { success: false, error: `求めるカード関連の取得に失敗: ${wantedError.message}`, posts: [] }
    }

    // Get offered cards relations
    const { data: offeredRelations, error: offeredError } = await supabase
      .from("trade_post_offered_cards")
      .select("post_id, card_id")
      .in("post_id", postIds)

    if (offeredError) {
      console.error("Error fetching offered card relations:", offeredError)
      return { success: false, error: `譲れるカード関連の取得に失敗: ${offeredError.message}`, posts: [] }
    }

    // Get all card IDs and fetch card details
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

    // Get comment counts
    const commentCountsMap = new Map<string, number>()
    try {
      const { data: allCommentsForPosts, error: commentFetchError } = await supabase
        .from("trade_comments")
        .select("post_id")
        .in("post_id", postIds)
        .eq("is_deleted", false)

      if (!commentFetchError && allCommentsForPosts) {
        allCommentsForPosts.forEach((comment) => {
          commentCountsMap.set(comment.post_id, (commentCountsMap.get(comment.post_id) || 0) + 1)
        })
      }
    } catch (e) {
      console.warn("Error fetching comment counts:", e)
    }

    // Build posts with card data and user info
    const postsWithCards = posts.map((post: any) => {
      const createdAt = new Date(post.created_at)
      const formattedDate = `${createdAt.getFullYear()}/${String(createdAt.getMonth() + 1).padStart(
        2,
        "0",
      )}/${String(createdAt.getDate()).padStart(2, "0")}`

      // Get user info
      let username: string
      let avatarUrl: string | null = null

      if (post.is_authenticated && post.owner_id) {
        const authUser = authUsersMap.get(post.owner_id)
        if (authUser) {
          username = authUser.username
          avatarUrl = authUser.avatarUrl
        } else {
          username = "ユーザー"
        }
      } else {
        username = post.guest_name || "ゲスト"
      }

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
    console.error("Unexpected error fetching trade posts:", error)
    const errorMessage = error instanceof Error ? error.message : "予期しないエラーが発生しました。"
    return { success: false, error: errorMessage, posts: [] }
  }
}

export async function getTradePostDetailsById(postId: string) {
  try {
    // Validate that postId is not "create" or other invalid values
    if (!postId || postId === "create" || postId.length < 8) {
      return {
        success: false,
        error: "無効な投稿IDです。",
        post: null,
      }
    }

    const supabase = await createServerClient()

    // First, get the main post data
    const { data: postData, error: postError } = await supabase
      .from("trade_posts")
      .select("*")
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

    // Get author info
    let authorInfo: { username: string; avatarUrl: string | null }

    if ((postData as any).is_authenticated && (postData as any).owner_id) {
      // Get auth user info
      const { data: authUser, error: userError } = await supabase.auth.admin.getUserById((postData as any).owner_id)

      if (!userError && authUser?.user) {
        const { username, avatarUrl } = getUserDisplayInfo(authUser.user)
        authorInfo = { username, avatarUrl }
      } else {
        authorInfo = { username: "ユーザー", avatarUrl: null }
      }
    } else {
      authorInfo = {
        username: (postData as any).guest_name || "ゲスト",
        avatarUrl: null,
      }
    }

    // Get wanted cards relationships
    const { data: wantedRelations, error: wantedError } = await supabase
      .from("trade_post_wanted_cards")
      .select("card_id, is_primary")
      .eq("post_id", postId)

    if (wantedError) {
      console.error(`Error fetching wanted cards for post ${postId}:`, wantedError)
    }

    // Get offered cards relationships
    const { data: offeredRelations, error: offeredError } = await supabase
      .from("trade_post_offered_cards")
      .select("card_id")
      .eq("post_id", postId)

    if (offeredError) {
      console.error(`Error fetching offered cards for post ${postId}:`, offeredError)
    }

    // Get all card IDs
    const allCardIds = new Set<number>()
    wantedRelations?.forEach((r) => allCardIds.add(r.card_id))
    offeredRelations?.forEach((r) => allCardIds.add(r.card_id))

    // Get card details
    const cardsMap = new Map<number, { id: string; name: string; image_url: string }>()
    if (allCardIds.size > 0) {
      const { data: cardDetails, error: cardsError } = await supabase
        .from("cards")
        .select("id, name, image_url")
        .in("id", Array.from(allCardIds))

      if (cardsError) {
        console.error(`Error fetching card details for post ${postId}:`, cardsError)
      } else {
        cardDetails?.forEach((c) => cardsMap.set(c.id, { ...c, id: c.id.toString() }))
      }
    }

    // Map wanted cards
    const wantedCards =
      wantedRelations?.map((wc) => {
        const card = cardsMap.get(wc.card_id)
        return {
          id: card?.id || wc.card_id.toString(),
          name: card?.name || "不明",
          imageUrl: card?.image_url || "/placeholder.svg?width=100&height=140",
          isPrimary: wc.is_primary,
        }
      }) || []

    // Map offered cards
    const offeredCards =
      offeredRelations?.map((oc) => {
        const card = cardsMap.get(oc.card_id)
        return {
          id: card?.id || oc.card_id.toString(),
          name: card?.name || "不明",
          imageUrl: card?.image_url || "/placeholder.svg?width=100&height=140",
        }
      }) || []

    // Get comments
    const { data: commentsData, error: commentsError } = await supabase
      .from("trade_comments")
      .select(`
        id, 
        user_id, 
        user_name, 
        guest_name,
        content, 
        created_at,
        is_guest
      `)
      .eq("post_id", postId)
      .eq("is_deleted", false)
      .order("created_at", { ascending: true })

    if (commentsError) {
      console.error(`Error fetching comments for post ${postId}:`, commentsError)
    }

    // Get auth users for authenticated commenters
    const authenticatedComments = commentsData?.filter((comment) => !comment.is_guest && comment.user_id) || []
    const commentUserIds = [...new Set(authenticatedComments.map((comment) => comment.user_id))]

    const commentAuthUsersMap = new Map()
    if (commentUserIds.length > 0) {
      const { data: authUsers, error: usersError } = await supabase.auth.admin.listUsers()

      if (!usersError && authUsers?.users) {
        authUsers.users.forEach((user) => {
          if (commentUserIds.includes(user.id)) {
            const { username, avatarUrl } = getUserDisplayInfo(user)
            commentAuthUsersMap.set(user.id, { username, avatarUrl })
          }
        })
      }
    }

    const comments =
      commentsData?.map((comment: any) => {
        const createdAt = new Date(comment.created_at)
        const diffSeconds = Math.floor((Date.now() - createdAt.getTime()) / 1000)
        let timestamp = `${createdAt.toLocaleDateString()}`
        if (diffSeconds < 60) timestamp = `${diffSeconds}秒前`
        else if (diffSeconds < 3600) timestamp = `${Math.floor(diffSeconds / 60)}分前`
        else if (diffSeconds < 86400) timestamp = `${Math.floor(diffSeconds / 3600)}時間前`
        else if (diffSeconds < 2592000) timestamp = `${Math.floor(diffSeconds / 86400)}日前`

        let commentAuthor: string
        let commentAvatar: string | null = null

        if (!comment.is_guest && comment.user_id) {
          const authUser = commentAuthUsersMap.get(comment.user_id)
          if (authUser) {
            commentAuthor = authUser.username
            commentAvatar = authUser.avatarUrl
          } else {
            commentAuthor = comment.user_name || "ユーザー"
          }
        } else {
          commentAuthor = comment.guest_name || comment.user_name || "ゲスト"
        }

        return {
          id: comment.id,
          author: commentAuthor,
          avatar: commentAvatar,
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
      authorNotes: postData.comment || "",
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

export async function addCommentToTradePost(postId: string, content: string, guestName?: string) {
  try {
    const supabase = await createServerClient()
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError) {
      console.warn("[addCommentToTradePost] Session error:", sessionError)
      // Continue as guest user
    }

    if (!content.trim()) {
      return { success: false, error: "コメント内容を入力してください。" }
    }

    const isAuthenticated = !!session?.user
    const userId = session?.user?.id || null
    const userName = isAuthenticated ? getUserDisplayInfo(session.user).username : guestName || "ゲスト"

    console.log("[addCommentToTradePost] User ID:", userId, "Is authenticated:", isAuthenticated)
    console.log("[addCommentToTradePost] Guest name:", guestName)

    const insertData: any = {
      post_id: postId,
      content: content,
      is_guest: !isAuthenticated,
    }

    // Only set user_id if user is authenticated
    if (isAuthenticated && userId) {
      insertData.user_id = userId
      insertData.user_name = userName
      insertData.guest_name = null
    } else {
      insertData.user_id = null
      insertData.user_name = userName
      insertData.guest_name = guestName || "ゲスト"
    }

    console.log("[addCommentToTradePost] Insert data:", insertData)

    const { error } = await supabase.from("trade_comments").insert(insertData)

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
