"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Star, ArrowLeft } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { getDeckById } from "@/lib/services/deck-service"
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

      // localStorageからお気に入りデッキのIDとソースタブ情報を取得
      const favoriteIds: string[] = []
      const sourceTabMap: { [key: string]: string } = {}

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(`favorite_${user?.id}_`) && localStorage.getItem(key) === "true") {
          const deckId = key.replace(`favorite_${user?.id}_`, "")
          favoriteIds.push(deckId)

          // ソースタブ情報も取得
          const sourceTabKey = `favorite_source_${user?.id}_${deckId}`
          const sourceTab = localStorage.getItem(sourceTabKey) || "みんなのデッキ"
          sourceTabMap[deckId] = sourceTab
        }
      }

      // 実際のデッキデータを取得
      const deckPromises = favoriteIds.map(async (deckId) => {
        try {
          const { data, error } = await getDeckById(deckId)
          if (error || !data) {
            console.error(`Failed to fetch deck ${deckId}:`, error)
            // エラーの場合は仮データを返す
            return {
              id: deckId,
              title: `デッキ ${deckId.slice(0, 8)}`,
              description: "デッキの詳細を取得できませんでした",
              likes: 0,
              like_count: 0,
              favorites: 0,
              favorite_count: 0,
              comments: 0,
              comment_count: 0,
              updated_at: new Date().toISOString(),
              imageUrl: "/placeholder.svg?width=120&height=168",
              source_tab: sourceTabMap[deckId],
            }
          }

          // 実際のデッキデータにソースタブ情報を追加
          return {
            ...data,
            source_tab: sourceTabMap[deckId],
          }
        } catch (err) {
          console.error(`Exception fetching deck ${deckId}:`, err)
          // エラーの場合は仮データを返す
          return {
            id: deckId,
            title: `デッキ ${deckId.slice(0, 8)}`,
            description: "デッキの詳細を取得できませんでした",
            likes: 0,
            like_count: 0,
            favorites: 0,
            favorite_count: 0,
            comments: 0,
            comment_count: 0,
            updated_at: new Date().toISOString(),
            imageUrl: "/placeholder.svg?width=120&height=168",
            source_tab: sourceTabMap[deckId],
          }
        }
      })

      const decks = await Promise.all(deckPromises)
      setFavoriteDecks(decks.filter(Boolean)) // nullやundefinedを除外
    } catch (err) {
      console.error("お気に入りデッキの読み込みに失敗しました:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveFromFavorites = async (deckId: string) => {
    if (!user) return

    try {
      // localStorageからお気に入り状態を削除
      const favoriteKey = `favorite_${user.id}_${deckId}`
      const sourceTabKey = `favorite_source_${user.id}_${deckId}`

      localStorage.removeItem(favoriteKey)
      localStorage.removeItem(sourceTabKey)

      // UIからデッキを削除
      setFavoriteDecks((prev) => prev.filter((deck) => deck.id !== deckId))
    } catch (err) {
      console.error("お気に入りの削除に失敗しました:", err)
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
            <div key={deck.id} className="relative">
              <DeckCard deck={deck} />
              {/* お気に入りから削除ボタン */}
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleRemoveFromFavorites(deck.id)
                }}
                className="absolute top-2 right-2 z-20 bg-white/80 hover:bg-white text-red-500 hover:text-red-700 p-1 h-auto"
                title="お気に入りから削除"
              >
                <Star className="h-4 w-4 fill-current" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
