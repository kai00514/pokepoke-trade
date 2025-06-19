import { type NextRequest, NextResponse } from "next/server"
import { getDeckComments, addDeckComment } from "@/lib/actions/deck-comments"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const deckId = searchParams.get("deckId")

    console.log("🌐 [API GET] Request received for deckId:", deckId)

    if (!deckId) {
      console.log("❌ [API GET] Missing deckId parameter")
      return NextResponse.json({ success: false, error: "deckId is required" }, { status: 400 })
    }

    const result = await getDeckComments(deckId)
    console.log("🌐 [API GET] getDeckComments result:", {
      success: result.success,
      commentsCount: result.comments?.length || 0,
      error: result.error,
    })

    if (!result.success) {
      console.error("❌ [API GET] Error from getDeckComments:", result.error)
      return NextResponse.json({ success: false, error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true, comments: result.comments })
  } catch (error: any) {
    console.error("❌ [API GET] Uncaught error:", error)
    return NextResponse.json(
      { success: false, error: `サーバー内部エラー: ${error.message || error}` },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("🌐 [API POST] Request received")

    const body = await request.json()
    console.log("🌐 [API POST] Request body:", {
      deckId: body.deckId,
      contentLength: body.content?.length,
      userId: body.userId,
      userName: body.userName,
      isGuest: body.isGuest,
    })

    const { deckId, content, userId, userName, isGuest } = body

    if (!deckId || !content) {
      console.log("❌ [API POST] Missing required fields:", {
        hasDeckId: !!deckId,
        hasContent: !!content,
      })
      return NextResponse.json({ success: false, error: "deckId and content are required" }, { status: 400 })
    }

    // user_nameの値を確認・設定
    let finalUserName = "ゲスト"

    if (isGuest || !userId) {
      finalUserName = "ゲスト"
      console.log("🌐 [API POST] Guest user detected, setting user_name to 'ゲスト'")
    } else if (userName && userName.trim()) {
      finalUserName = userName.trim()
      console.log("🌐 [API POST] Using provided userName:", finalUserName)
    } else {
      finalUserName = "匿名ユーザー"
      console.log("🌐 [API POST] No userName provided, using default:", finalUserName)
    }

    console.log("🌐 [API POST] Calling addDeckComment with:", {
      deckId,
      userId: userId || null,
      finalUserName,
      isGuest: isGuest || !userId,
    })

    const result = await addDeckComment(deckId, content, userId, finalUserName, isGuest || !userId)

    console.log("🌐 [API POST] addDeckComment result:", {
      success: result.success,
      commentId: result.comment?.id,
      error: result.error,
    })

    if (!result.success) {
      console.error("❌ [API POST] Error from addDeckComment:", result.error)
      return NextResponse.json({ success: false, error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true, comment: result.comment })
  } catch (error: any) {
    console.error("❌ [API POST] Uncaught error:", error)
    return NextResponse.json(
      { success: false, error: `サーバー内部エラー: ${error.message || error}` },
      { status: 500 },
    )
  }
}
