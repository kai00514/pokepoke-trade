import { NextResponse } from "next/server"
import { getComments } from "@/lib/actions/trade-comments"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const deckId = searchParams.get("deckId")

  if (!deckId) {
    return NextResponse.json({ success: false, error: "デッキIDが必要です" }, { status: 400 })
  }

  try {
    const result = await getComments(deckId)
    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error("Error fetching deck comments:", error)
    return NextResponse.json({ success: false, error: "コメントの取得に失敗しました" }, { status: 500 })
  }
}
