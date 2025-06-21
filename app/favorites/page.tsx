"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { DeckCard, type Deck } from "@/components/deck-card" // ここを名前付きインポートに修正
import { unfavoriteDeck } from "@/lib/services/deck-service" // unfavoriteDeckを個別にインポート
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Star, PlusCircle } from "lucide-react"
import Link from "next/link"

export default function FavoritesPage() {
  const [favoriteDecks, setFavoriteDecks] = useState<Deck[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()
  const { user } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    const fetchFavoriteDecks = async () => {
      if (!user) {
        setIsLoading(false)
        setError("ログインしてお気に入りデッキを表示してください。")
        return
      }

      setIsLoading(true)
      setError(null)
      try {
        const { data, error } = await supabase
          .from("deck_favorites")
          .select(
            `
            deck_id,
            category,
            decks (
              id,
              title,
              description,
              user_id,
              user_display_name,
              is_public,
              tags,
              thumbnail_card_id,
              created_at,
              updated_at,
              like_count,
              favorite_count,
              view_count,
              comment_count,
              deck_cards (
                card_id,
                quantity
              )
            )
          `,
          )
          .eq("user_id", user.id)

        if (error) {
          console.error("Error fetching favorite decks:", error)
          setError("お気に入りデッキの取得に失敗しました。")
          setFavoriteDecks([])
          return
        }

        if (data) {
          const formattedDecks: Deck[] = data
            .filter((item) => item.decks !== null)
            .map((item) => {
              const deckData = item.decks as Deck // 型アサーション
              return {
                id: deckData.id,
                name: deckData.title || "無題のデッキ",
                imageUrl: deckData.thumbnail_card_id
                  ? `/placeholder.svg?width=120&height=168&text=Card+${deckData.thumbnail_card_id}`
                  : "/placeholder.svg?width=120&height=168",
                cardName: deckData.title || "カード名不明", // 仮の値
                updatedAt: new Date(deckData.updated_at).toLocaleDateString("ja-JP"),
                likes: deckData.like_count || 0,
                favorites: deckData.favorite_count || 0,
                views: deckData.view_count || 0,
                comments: deckData.comment_count || 0,
                category: item.category || "posts", // お気に入り時のカテゴリを保持
              }
            })
          setFavoriteDecks(formattedDecks)
        }
      } catch (err) {
        console.error("Exception fetching favorite decks:", err)
        setError("お気に入りデッキの取得中に予期せぬエラーが発生しました。")
        setFavoriteDecks([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchFavoriteDecks()
  }, [user, supabase])

  const handleRemoveFavorite = async (deckId: string) => {
    if (!user) {
      toast({
        title: "エラー",
        description: "ログインしてお気に入りを解除してください。",
        variant: "destructive",
      })
      return
    }

    const { error } = await unfavoriteDeck(deckId) // 個別にインポートしたunfavoriteDeckを使用

    if (error) {
      toast({
        title: "エラー",
        description: `お気に入りの解除に失敗しました: ${error}`,
        variant: "destructive",
      })
    } else {
      toast({
        title: "成功",
        description: "お気に入りを解除しました。",
      })
      setFavoriteDecks((prevDecks) => prevDecks.filter((deck) => deck.id !== deckId))
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-100px)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-slate-500">お気に入りデッキを読み込み中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500 mb-4">{error}</p>
        {!user && (
          <Button asChild className="bg-purple-600 hover:bg-purple-700 text-white">
            <Link href="/auth/login">ログインする</Link>
          </Button>
        )}
      </div>
    )
  }

  if (favoriteDecks.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="mb-6">
          <Star className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-600 mb-2">お気に入りデッキがありません</h3>
          <p className="text-slate-500 mb-6">デッキ一覧からお気に入りのデッキを見つけてみましょう！</p>
        </div>
        <Button asChild className="bg-emerald-500 hover:bg-emerald-600 text-white">
          <Link href="/decks">
            <PlusCircle className="mr-2 h-4 w-4" />
            デッキ一覧へ
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center text-yellow-600">お気に入りデッキ</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {favoriteDecks.map((deck) => (
          <DeckCard
            key={deck.id}
            deck={deck}
            onCountUpdate={() => {
              /* お気に入りページではカウント更新は不要 */
            }}
            currentCategory={deck.category || "posts"} // お気に入り時のカテゴリを渡す
            onRemoveFavorite={handleRemoveFavorite} // お気に入り解除ハンドラを渡す
          />
        ))}
      </div>
    </div>
  )
}
