"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Star, ArrowLeft } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { getDeckById, unfavoriteDeck } from "@/lib/services/deck-service"
import DeckCard from "@/components/deck-card"
import type { Deck } from "@/types/deck"
import { useToast } from "@/components/ui/use-toast"

export default function FavoritesPage() {
  const [favoriteDecks, setFavoriteDecks] = useState<Deck[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

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

      const favoriteIds: string[] = []
      const sourceTabMap: { [key: string]: string } = {}

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && user?.id && key.startsWith(`favorite_${user.id}_`) && localStorage.getItem(key) === "true") {
          const deckId = key.replace(`favorite_${user.id}_`, "")
          favoriteIds.push(deckId)

          const sourceTabKey = `favorite_source_${user.id}_${deckId}`
          const sourceTab = localStorage.getItem(sourceTabKey) || "みんなのデッキ"
          sourceTabMap[deckId] = sourceTab
        }
      }

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
              like_count: 0,
              favorite_count: 0,
              comment_count: 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              view_count: 0,
              thumbnail_image_url: "/placeholder.svg?width=120&height=168",
              source_tab: sourceTabMap[deckId],
              is_deck_page: false,
            } as Deck
          }

          // 実際のデッキデータにソースタブ情報を追加し、プロパティの堅牢性を確保
          return {
            id: data.id,
            title: data.title || `デッキ ${data.id.slice(0, 8)}`, // nullの場合のフォールバック
            description: data.description || "詳細情報なし",
            like_count: data.like_count ?? 0, // nullish coalescing operator
            favorite_count: data.favorite_count ?? 0,
            comment_count: data.comment_count ?? 0,
            created_at: data.created_at || new Date().toISOString(),
            updated_at: data.updated_at || new Date().toISOString(),
            view_count: data.view_count ?? 0,
            thumbnail_image_url: data.thumbnail_image_url || "/placeholder.svg?width=120&height=168",
            source_tab: sourceTabMap[deckId],
            is_deck_page: data.is_deck_page ?? false,
          } as Deck
        } catch (err) {
          console.error(`Exception fetching deck ${deckId}:`, err)
          // エラーの場合は仮データを返す
          return {
            id: deckId,
            title: `デッキ ${deckId.slice(0, 8)}`,
            description: "デッキの詳細を取得できませんでした",
            like_count: 0,
            favorite_count: 0,
            comment_count: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            view_count: 0,
            thumbnail_image_url: "/placeholder.svg?width=120&height=168",
            source_tab: sourceTabMap[deckId],
            is_deck_page: false,
          } as Deck
        }
      })

      const decks = await Promise.all(deckPromises)
      setFavoriteDecks(decks.filter(Boolean) as Deck[])
    } catch (err) {
      console.error("お気に入りデッキの読み込みに失敗しました:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveFromFavorites = async (deckId: string) => {
    if (!user) return

    try {
      const { error } = await unfavoriteDeck(deckId)

      if (error) {
        console.error("Failed to unfavorite deck:", error)
        toast({ title: "エラー", description: error || "お気に入りの削除に失敗しました", variant: "destructive" })
        return
      }

      const favoriteKey = `favorite_${user.id}_${deckId}`
      const sourceTabKey = `favorite_source_${user.id}_${deckId}`

      localStorage.removeItem(favoriteKey)
      localStorage.removeItem(sourceTabKey)

      setFavoriteDecks((prev) => prev.filter((deck) => deck.id !== deckId))
      toast({ title: "成功", description: "お気に入りから削除しました", variant: "default" })
    } catch (err) {
      console.error("お気に入りの削除に失敗しました:", err)
      toast({
        title: "エラー",
        description: "お気に入りの削除中に予期せぬエラーが発生しました",
        variant: "destructive",
      })
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
