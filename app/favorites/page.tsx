"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Heart, Eye, MessageCircle, Star, ArrowLeft } from "lucide-react"
import { favoritesService } from "@/lib/services/favorites-service"
import { useAuth } from "@/contexts/auth-context"
import type { Database } from "@/types/supabase"

type DeckWithDetails = Database["public"]["Tables"]["decks"]["Row"] & {
  user_profiles?: {
    display_name: string | null
  } | null
}

export default function FavoritesPage() {
  const [decks, setDecks] = useState<DeckWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
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
      const result = await favoritesService.getFavoriteDecks()

      if (result.error) {
        setError(result.error)
      } else {
        setDecks(result.decks)
      }
    } catch (err) {
      setError("お気に入りデッキの読み込みに失敗しました")
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveFromFavorites = async (deckId: string) => {
    const result = await favoritesService.removeFromFavorites(deckId)

    if (result.success) {
      setDecks((prev) => prev.filter((deck) => deck.id !== deckId))
    } else {
      setError(result.error || "お気に入りの削除に失敗しました")
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

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">お気に入りデッキ</h1>
        </div>
        <div className="text-center py-8 text-red-500">{error}</div>
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
        <Badge variant="secondary">{decks.length}件</Badge>
      </div>

      {decks.length === 0 ? (
        <div className="text-center py-12">
          <Star className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium mb-2">お気に入りデッキがありません</h3>
          <p className="text-gray-600 mb-4">気になるデッキを見つけてお気に入りに追加しましょう</p>
          <Button onClick={() => router.push("/decks")}>デッキを探す</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {decks.map((deck) => (
            <Card key={deck.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg line-clamp-2">{deck.title}</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveFromFavorites(deck.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Heart className="h-4 w-4 fill-current" />
                  </Button>
                </div>
                {deck.user_profiles?.display_name && (
                  <p className="text-sm text-gray-600">by {deck.user_profiles.display_name}</p>
                )}
              </CardHeader>
              <CardContent>
                {deck.description && <p className="text-sm text-gray-600 mb-4 line-clamp-3">{deck.description}</p>}

                <div className="flex flex-wrap gap-2 mb-4">
                  {deck.tier && <Badge variant="outline">{deck.tier}</Badge>}
                  {deck.tags?.slice(0, 3).map((tag, index) => (
                    <Badge key={index} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>

                <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Heart className="h-4 w-4" />
                      {deck.like_count || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="h-4 w-4" />
                      {deck.favorite_count || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="h-4 w-4" />
                      {deck.comment_count || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      {deck.view_count || 0}
                    </span>
                  </div>
                </div>

                <Button className="w-full" onClick={() => router.push(`/decks/${deck.id}`)}>
                  デッキを見る
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
