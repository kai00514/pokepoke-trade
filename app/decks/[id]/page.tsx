"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"

export default function DeckDetailPage() {
  const { id } = useParams() as { id: string }
  const router = useRouter()

  // "create" パスの場合は /decks/create にリダイレクト
  useEffect(() => {
    if (id === "create") {
      router.replace("/decks/create")
      return
    }
  }, [id, router])

  // id が "create" の場合は何も表示しない（リダイレクト中）
  if (id === "create") {
    return null
  }

  // 既存のコードを続ける...
  return (
    <div>
      <h1>Deck Detail Page</h1>
      <p>Deck ID: {id}</p>
    </div>
  )
}
