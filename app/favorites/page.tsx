"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Star, ArrowLeft } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import DeckCard from "@/components/deck-card"

export default function FavoritesPage() {
  const [favoriteDecks, setFavoriteDecks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.push("/auth/login")
      return
    }

    loadFavoriteDecks()
  }, [user, router])

  const loadFavoriteDecks = async () => {
    try {
      setLoading(true)

      // localStorageからお気に入りデッキのIDを取得
      const favoriteIds: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(`favorite_${user?.id}_`) && localStorage.getItem(key) === "true") {
          const deckId = key.replace(`favorite_${user?.id}_`, "")
          favoriteIds.push(deckId)
        }
      }

      // 簡易的なサンプルデッキデータ（実際の実装では、これらのIDでデッキデータを取得）
      const sampleDecks = favoriteIds.map((id) => ({
        id,
        title: `お気に入りデッキ ${id.slice(0, 8)}`,
        description: "お気に入りに追加されたデッキです",
        likes: Math.floor(Math.random() * 100),
        favorites: Math.floor(Math.random() * 50),
        comments: Math.floor(Math.random() * 20),
        updated_at: new Date().toISOString(),
        imageUrl: "/placeholder.svg?width=120&height=168",
      }))

      setFavoriteDecks(sampleDecks)
    } catch (err) {
      console.error("お気に入りデッキの読み込みに失敗しました:", err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">お気に入りデッキ</h1>
        </div>
        <div className="text-center py-8">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">お気に入りデッキ</h1>
        <Badge variant="secondary">{favoriteDecks.length}件</Badge>
      </div>

      {favoriteDecks.length === 0 ? (
        <div className="text-center py-12">
          <Star className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium mb-2">お気に入りデッキがありません</h3>
          <p className="text-gray-600 mb-4">気になるデッキを見つけてお気に入りに追加しましょう</p>
          <Button onClick={() => router.push("/decks")}>デッキを探す</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {favoriteDecks.map((deck) => (
            <DeckCard key={deck.id} deck={deck} />
          ))}
        </div>
      )}
    </div>
  )
}
