import { type NextRequest, NextResponse } from "next/server"
import { addDeckComment, getDeckComments } from "@/lib/actions/deck-comments"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const deckId = searchParams.get("deckId")
    const commentType = searchParams.get("commentType") as "deck" | "deck_page" | null

    console.log("🌐 [API GET] Received request:", { deckId, commentType })

    if (!deckId) {
      console.log("❌ [API GET] Missing deckId parameter")
      return NextResponse.json({ success: false, error: "deckId parameter is required" }, { status: 400 })
    }

    const result = await getDeckComments(deckId, commentType || undefined)
    console.log("🌐 [API GET] getDeckComments result:", {
      success: result.success,
      commentsCount: result.comments?.length || 0,
      error: result.error,
    })

    if (result.success) {
      return NextResponse.json({ success: true, comments: result.comments })
    } else {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 })
    }
  } catch (error) {
    console.error("❌ [API GET] Unexpected error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { deckId, content, userId, userName, isGuest, commentType } = body

    console.log("🌐 [API POST] Received request:", {
      deckId,
      contentLength: content?.length,
      userId,
      userName,
      isGuest,
      commentType,
    })

    if (!deckId || !content) {
      console.log("❌ [API POST] Missing required parameters")
      return NextResponse.json({ success: false, error: "deckId and content are required" }, { status: 400 })
    }

    // commentTypeが指定されていない場合のデフォルト値を設定
    const finalCommentType = commentType || "deck"

    console.log("🌐 [API POST] Using commentType:", finalCommentType)

    const result = await addDeckComment(deckId, content, userId, userName, isGuest, finalCommentType)
    console.log("🌐 [API POST] addDeckComment result:", {
      success: result.success,
      commentId: result.comment?.id,
      error: result.error,
    })

    if (result.success) {
      return NextResponse.json({ success: true, comment: result.comment })
    } else {
      console.error("❌ [API POST] Error from addDeckComment:", result.error)
      return NextResponse.json({ success: false, error: result.error }, { status: 500 })
    }
  } catch (error) {
    console.error("❌ [API POST] Unexpected error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
