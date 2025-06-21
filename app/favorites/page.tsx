"use client"

import { useState, useEffect } from "react"
import { DeckCard, type Deck } from "@/components/deck-card"
import { unfavoriteDeck, getFavoriteDecks } from "@/lib/services/deck-service"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Star, PlusCircle, ArrowLeft, Lock } from "lucide-react" // Lockアイコンを追加
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"

export default function FavoritesPage() {
  const [favoriteDecks, setFavoriteDecks] = useState<Deck[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    const fetchDecks = async () => {
      if (!user) {
        setLoading(false)
        // ゲストユーザーの場合のエラーメッセージを調整
        setError("お気に入りデッキを表示するにはログインが必要です。")
        return
      }

      setLoading(true)
      setError(null)
      try {
        const { data, error } = await getFavoriteDecks()
        if (error) {
          console.error("Error fetching favorite decks:", error)
          setError("お気に入りデッキの取得に失敗しました。")
          setFavoriteDecks([])
        } else {
          setFavoriteDecks(data)
        }
      } catch (err) {
        console.error("Exception fetching favorite decks:", err)
        setError("お気に入りデッキの取得中に予期せぬエラーが発生しました。")
        setFavoriteDecks([])
      } finally {
        setLoading(false)
      }
    }

    fetchDecks()
  }, [user, toast])

  const handleRemoveFavorite = async (deckId: string) => {
    if (!user) {
      toast({
        title: "エラー",
        description: "ログインしてお気に入りを解除してください。",
        variant: "destructive",
      })
      return
    }

    const { error } = await unfavoriteDeck(deckId)

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

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center py-12 bg-gradient-to-br from-purple-50 to-purple-100">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">お気に入りデッキ</h1>
          </div>
          <div className="flex justify-center items-center h-48">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-slate-500">お気に入りデッキを読み込み中...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error && !user) {
    // ゲストユーザーでエラーの場合のみモダンな表示
    return (
      <div className="min-h-screen flex flex-col items-center justify-center py-12 bg-gradient-to-br from-purple-50 to-purple-100">
        <div className="text-center p-8 rounded-lg">
          <Lock className="h-16 w-16 text-purple-500 mx-auto mb-6" />
          <h3 className="text-3xl font-bold text-gray-800 mb-4">お気に入りデッキはログイン後に表示されます</h3>
          <p className="text-lg text-gray-600 mb-8">
            お気に入りのデッキを保存して、いつでも簡単にアクセスできるようにしましょう。
          </p>
          <Button
            asChild
            className="bg-purple-600 hover:bg-purple-700 text-white text-lg px-8 py-3 rounded-full shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105"
          >
            <Link href="/auth/login">ログインする</Link>
          </Button>
        </div>
      </div>
    )
  }

  if (error) {
    // その他のエラーの場合（ログイン済みだが取得エラーなど）
    return (
      <div className="min-h-screen flex flex-col items-center justify-center py-12 bg-gradient-to-br from-purple-50 to-purple-100">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">お気に入りデッキ</h1>
          </div>
          <div className="text-center py-20">
            <p className="text-red-500 mb-4">{error}</p>
            {/* ログイン済みでもエラーの場合は、ログインボタンは表示しない */}
          </div>
        </div>
      </div>
    )
  }

  if (favoriteDecks.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center py-12 bg-gradient-to-br from-purple-50 to-purple-100">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">お気に入りデッキ</h1>
          </div>
          <div className="text-center py-12">
            <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">お気に入りデッキがありません</h3>
            <p className="text-gray-600 mb-4">気になるデッキを見つけてお気に入りに追加しましょう</p>
            <Button asChild className="bg-emerald-500 hover:bg-emerald-600 text-white">
              <Link href="/decks">
                <PlusCircle className="mr-2 h-4 w-4" />
                デッキを探す
              </Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col py-12 bg-gradient-to-br from-purple-50 to-purple-100">
      <div className="container mx-auto px-4 py-8 flex-grow">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">お気に入りデッキ</h1>
          <Badge variant="secondary">{favoriteDecks.length}件</Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {favoriteDecks.map((deck) => (
            <div key={deck.id} className="relative">
              <DeckCard
                deck={deck}
                currentCategory={deck.category || "favorites"}
                onRemoveFavorite={handleRemoveFavorite}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
