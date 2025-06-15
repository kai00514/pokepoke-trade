"use client"

import type React from "react"

import { useState, useCallback } from "react"
import AuthHeader from "@/components/auth-header"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { PlusCircle, Users, ListChecks, BarChartBig, Zap } from "lucide-react"
import Link from "next/link"
import DeckCard, { type Deck } from "@/components/deck-card"
import { getDecksList, getDeckPagesList } from "@/lib/actions/deck-posts"
import { useToast } from "@/components/ui/use-toast"

type TabId = "posted" | "tier" | "featured" | "newpack"

interface CategoryInfo {
  id: TabId
  title: string
  icon: React.ComponentType<{ className?: string }>
  description?: string
}

const categories: CategoryInfo[] = [
  {
    id: "posted",
    title: "みんなのデッキを見る",
    icon: Users,
    description: "投稿されたデッキを閲覧",
  },
  {
    id: "tier",
    title: "Tierランキング",
    icon: ListChecks,
    description: "デッキの強さランキング",
  },
  {
    id: "featured",
    title: "注目ランキング",
    icon: BarChartBig,
    description: "話題のデッキランキング",
  },
  {
    id: "newpack",
    title: "新パックデッキランキング",
    icon: Zap,
    description: "最新パックを使ったデッキ",
  },
]

// deck_pagesデータ用の拡張型
interface DeckPageData extends Deck {
  is_deck_page?: boolean
}

export default function DecksPage() {
  const [selectedCategory, setSelectedCategory] = useState<TabId | null>(null)
  const [decks, setDecks] = useState<DeckPageData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // みんなのデッキを取得
  const fetchPostedDecks = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await getDecksList({ isPublic: true, limit: 50 })
      if (result.success && result.data) {
        // 通常のデッキデータにis_deck_pageフラグを追加
        const decksWithFlag = result.data.map((deck) => ({
          ...deck,
          is_deck_page: false,
        }))
        setDecks(decksWithFlag)
      } else {
        setError(result.error || "デッキの取得に失敗しました")
        toast({
          title: "エラー",
          description: result.error || "デッキの取得に失敗しました",
          variant: "destructive",
        })
      }
    } catch (err) {
      const errorMessage = "デッキの取得中にエラーが発生しました"
      setError(errorMessage)
      toast({
        title: "エラー",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  // deck_pagesテーブルからデッキを取得
  const fetchDeckPages = useCallback(
    async (sortBy: "tier" | "popular" | "latest") => {
      setIsLoading(true)
      setError(null)
      try {
        const result = await getDeckPagesList({ sortBy, limit: 50 })
        if (result.success && result.data) {
          // deck_pagesのデータをDeck型に変換
          const formattedDecks: DeckPageData[] = result.data.map((deckPage: any) => ({
            id: deckPage.id.toString(),
            name: deckPage.title || deckPage.deck_name || "無題のデッキ",
            imageUrl: deckPage.thumbnail_image_url || "/placeholder.svg?width=150&height=210",
            cardName: deckPage.deck_name || "カード名不明",
            updatedAt: new Date(deckPage.updated_at).toLocaleDateString("ja-JP"),
            likes: deckPage.like_count || 0,
            favorites: 0,
            views: deckPage.view_count || 0,
            is_deck_page: true, // deck_pagesテーブルのデータであることを示すフラグ
          }))
          setDecks(formattedDecks)
        } else {
          setError(result.error || "デッキの取得に失敗しました")
          toast({
            title: "エラー",
            description: result.error || "デッキの取得に失敗しました",
            variant: "destructive",
          })
        }
      } catch (err) {
        const errorMessage = "デッキの取得中にエラーが発生しました"
        setError(errorMessage)
        toast({
          title: "エラー",
          description: errorMessage,
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    },
    [toast],
  )

  const handleCategoryClick = (categoryId: TabId) => {
    setSelectedCategory(categoryId)
    if (categoryId === "posted") {
      fetchPostedDecks()
    } else if (categoryId === "tier") {
      fetchDeckPages("tier")
    } else if (categoryId === "featured") {
      fetchDeckPages("popular")
    } else if (categoryId === "newpack") {
      fetchDeckPages("latest")
    }
  }

  const renderDeckList = () => {
    if (!selectedCategory) return null

    if (isLoading) {
      return (
        <div className="flex justify-center items-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-slate-500">デッキを読み込み中...</p>
          </div>
        </div>
      )
    }

    if (error) {
      return (
        <div className="text-center py-20">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => handleCategoryClick(selectedCategory)} variant="outline">
            再試行
          </Button>
        </div>
      )
    }

    if (decks.length === 0) {
      return (
        <div className="text-center py-20">
          <div className="mb-6">
            <PlusCircle className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-600 mb-2">まだデッキが投稿されていません</h3>
            <p className="text-slate-500 mb-6">最初のデッキを投稿してみませんか？</p>
          </div>
          <Button asChild className="bg-emerald-500 hover:bg-emerald-600 text-white">
            <Link href="/decks/create">
              <PlusCircle className="mr-2 h-4 w-4" />
              デッキを投稿する
            </Link>
          </Button>
        </div>
      )
    }

    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {decks.map((deck) => (
          <DeckCard key={deck.id} deck={deck} />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-purple-50 to-purple-100">
      <AuthHeader />
      <main className="flex-grow container mx-auto px-4 pb-8">
        {/* デッキを投稿するボタン */}
        <div className="my-6 flex justify-center">
          <Button
            asChild
            className="bg-emerald-500 hover:bg-emerald-600 text-white text-base font-semibold py-3 px-8 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 ease-in-out transform hover:-translate-y-0.5"
          >
            <Link href="/decks/create">
              <PlusCircle className="mr-2 h-5 w-5" />
              デッキを投稿する
            </Link>
          </Button>
        </div>

        {selectedCategory ? (
          // カテゴリが選択された場合はデッキリストを表示
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Button onClick={() => setSelectedCategory(null)} variant="outline" className="flex items-center gap-2">
                ← 戻る
              </Button>
              <h2 className="text-2xl font-bold text-slate-800">
                {categories.find((cat) => cat.id === selectedCategory)?.title}
              </h2>
            </div>
            {renderDeckList()}
          </div>
        ) : (
          // カテゴリ選択画面
          <div className="space-y-8">
            {/* カテゴリグリッド */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {categories.map((category) => {
                const IconComponent = category.icon
                return (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryClick(category.id)}
                    className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-purple-100 hover:border-purple-200"
                  >
                    <div className="flex flex-col items-center text-center space-y-4">
                      <div className="p-4 bg-purple-100 rounded-full group-hover:bg-purple-200 transition-colors duration-300">
                        <IconComponent className="h-8 w-8 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-800 mb-2">{category.title}</h3>
                        {category.description && <p className="text-sm text-slate-500">{category.description}</p>}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* デッキを探すセクション */}
            <div className="max-w-4xl mx-auto">
              <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-600" />
                デッキを探す
              </h2>
              <div className="bg-white rounded-xl p-6 shadow-md border border-purple-100">
                <button
                  onClick={() => handleCategoryClick("posted")}
                  className="flex items-center gap-3 text-purple-600 hover:text-purple-700 font-medium transition-colors duration-200"
                >
                  <Users className="h-4 w-4" />
                  みんなのデッキ
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
