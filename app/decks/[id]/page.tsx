"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Heart, StarIcon, ArrowLeft, User, Calendar, Tag, Eye, Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import {
  getDeckById,
  likeDeck,
  unlikeDeck,
  favoriteDeck,
  unfavoriteDeck,
  getDeckUserActions,
} from "@/lib/services/deck-service"
import { fetchCardDetailsByIds } from "@/lib/card-api"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/components/ui/use-toast"
import CardDisplay from "@/components/card-display"
import Header from "@/components/layout/header"
import { FooterNavigation } from "@/components/layout/footer-navigation"
import { ThemeProvider } from "@/components/theme-provider"
import type { DeckWithCards } from "@/types/deck-types"
import type { CardData } from "@/lib/card-utils"
import { AuthProvider } from "@/contexts/auth-context"
import DeckComments from "@/components/DeckComments"

export default function DeckDetailPage() {
  const { id } = useParams() as { id: string }
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [deck, setDeck] = useState<DeckWithCards | null>(null)
  const [cardDetails, setCardDetails] = useState<Record<string, CardData>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isLiked, setIsLiked] = useState(false)
  const [isFavorited, setIsFavorited] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [favoriteCount, setFavoriteCount] = useState(0)
  const [viewCount, setViewCount] = useState(0)
  const { toast } = useToast()

  const groupCardsByType = (cards: CardData[]): Record<string, CardData[]> => {
    return cards.reduce(
      (acc, card) => {
        const type = card.type_code || "unknown"
        if (!acc[type]) {
          acc[type] = []
        }
        acc[type].push(card)
        return acc
      },
      {} as Record<string, CardData[]>,
    )
  }

  useEffect(() => {
    const fetchDeckData = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const { data, error } = await getDeckById(id)
        if (error || !data) {
          setError(error || "デッキの取得に失敗しました")
          return
        }
        setDeck(data)
        setLikeCount(data.like_count || 0)
        setFavoriteCount(data.favorite_count || 0)
        setViewCount(data.view_count || 0)
        if (data.deck_cards && data.deck_cards.length > 0) {
          const cardIds = data.deck_cards.map((dc) => String(dc.card_id))
          const details = await fetchCardDetailsByIds(cardIds)
          const detailsMap = details.reduce(
            (acc, card) => {
              acc[String(card.id)] = card
              return acc
            },
            {} as Record<string, CardData>,
          )
          setCardDetails(detailsMap)
        }
        if (user?.id) {
          const { liked, favorited } = await getDeckUserActions(id, user.id)
          setIsLiked(liked)
          setIsFavorited(favorited)
        }
      } catch (err) {
        console.error("Error fetching deck:", err)
        setError("デッキの読み込み中にエラーが発生しました")
      } finally {
        setIsLoading(false)
      }
    }
    if (!authLoading) {
      fetchDeckData()
    }
  }, [id, user, authLoading])

  const handleLike = async () => {
    if (!user) {
      toast({ title: "ログインしてください", variant: "destructive" })
      return
    }
    const originalIsLiked = isLiked
    const originalLikeCount = likeCount
    setIsLiked(!isLiked)
    setLikeCount((prev) => (originalIsLiked ? prev - 1 : prev + 1))
    try {
      const action = originalIsLiked ? unlikeDeck : likeDeck
      const { error } = await action(id)
      if (error) {
        toast({ title: "エラー", description: error, variant: "destructive" })
        setIsLiked(originalIsLiked)
        setLikeCount(originalLikeCount)
      } else {
        const { data: updatedDeck } = await getDeckById(id)
        if (updatedDeck) {
          setLikeCount(updatedDeck.like_count || 0)
        }
      }
    } catch (err) {
      console.error("Error toggling like:", err)
      toast({ title: "エラー", description: "操作に失敗しました", variant: "destructive" })
      setIsLiked(originalIsLiked)
      setLikeCount(originalLikeCount)
    }
  }

  const handleFavorite = async () => {
    if (!user) {
      toast({ title: "ログインしてください", variant: "destructive" })
      return
    }
    const originalIsFavorited = isFavorited
    const originalFavoriteCount = favoriteCount
    setIsFavorited(!isFavorited)
    setFavoriteCount((prev) => (originalIsFavorited ? prev - 1 : prev + 1))
    try {
      const action = originalIsFavorited ? unfavoriteDeck : favoriteDeck
      const { error } = await action(id)
      if (error) {
        toast({ title: "エラー", description: error, variant: "destructive" })
        setIsFavorited(originalIsFavorited)
        setFavoriteCount(originalFavoriteCount)
      } else {
        const { data: updatedDeck } = await getDeckById(id)
        if (updatedDeck) {
          setFavoriteCount(updatedDeck.favorite_count || 0)
        }
      }
    } catch (err) {
      console.error("Error toggling favorite:", err)
      toast({ title: "エラー", description: "操作に失敗しました", variant: "destructive" })
      setIsFavorited(originalIsFavorited)
      setFavoriteCount(originalFavoriteCount)
    }
  }

  if (isLoading) {
    return (
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <AuthProvider>
          <div className="min-h-screen bg-gray-50">
            <Header />
            <main className="container mx-auto px-4 py-8">
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                  <Loader2 className="h-12 w-12 animate-spin text-[#6246ea] mx-auto mb-4" />
                  <p className="text-gray-600 text-lg">デッキ情報を読み込み中...</p>
                </div>
              </div>
            </main>
            <FooterNavigation />
          </div>
        </AuthProvider>
      </ThemeProvider>
    )
  }

  if (error || !deck) {
    return (
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <AuthProvider>
          <div className="min-h-screen bg-gray-50">
            <Header />
            <main className="container mx-auto px-4 py-8">
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                  <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4">
                    <p>{error || "デッキが見つかりません"}</p>
                  </div>
                  <Button onClick={() => router.back()} variant="outline" className="mr-2">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    戻る
                  </Button>
                  <Button onClick={() => router.push("/decks")}>デッキ一覧へ</Button>
                </div>
              </div>
            </main>
            <FooterNavigation />
          </div>
        </AuthProvider>
      </ThemeProvider>
    )
  }

  const cardsWithDetails = deck.deck_cards.flatMap((dc) => {
    const cardDetail = cardDetails[String(dc.card_id)]
    if (!cardDetail?.id) return []
    return Array.from({ length: dc.quantity }, (_, index) => ({
      ...cardDetail,
      quantity: dc.quantity,
      card_id: dc.card_id,
      uniqueKey: `${dc.card_id}-${index}`,
    }))
  })

  const cardsByType = groupCardsByType(cardsWithDetails)
  const totalCards = deck.deck_cards.reduce((sum, card) => sum + card.quantity, 0)

  const renderCardGrid = (cardsToRender: (CardData & { uniqueKey: string })[]) => (
    <div className="overflow-x-auto pb-4">
      {" "}
      {/* 横スクロールを有効化 */}
      <div
        className="grid grid-rows-2 grid-flow-col auto-cols-[80px] sm:auto-cols-[90px] md:auto-cols-[100px] gap-x-3 gap-y-4"
        style={{ minWidth: "max-content" }} // コンテンツがはみ出さないように最小幅を設定
      >
        {cardsToRender.map((card) => (
          <div key={card.uniqueKey} className="w-[80px] sm:w-[90px] md:w-[100px] flex flex-col items-center">
            {/* カード画像コンテナ: アスペクト比5:7 */}
            <div className="w-full aspect-[5/7] bg-gray-100 rounded-md overflow-hidden border border-gray-200 shadow-sm mb-1.5">
              <CardDisplay cardId={card.card_id} useThumb={false} fill objectFit="contain" />
            </div>
            {/* カード名 */}
            <p className="text-xs font-medium text-center truncate w-full text-gray-700">{card.name}</p>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50 pb-20">
          <Header />
          <main className="container mx-auto px-4 py-6 pb-8">
            <div className="mb-4">
              <Button variant="ghost" size="sm" onClick={() => router.back()} className="text-gray-600">
                <ArrowLeft className="mr-2 h-4 w-4" />
                戻る
              </Button>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{deck.title}</h1>
                  <div className="flex flex-wrap gap-2 items-center text-sm text-gray-600 mb-3">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-1" />
                      <span>{deck.user_display_name || "匿名ユーザー"}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span>作成日: {new Date(deck.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center">
                      <Tag className="h-4 w-4 mr-1" />
                      <span>カード数: {totalCards}枚</span>
                    </div>
                  </div>
                  {deck.description && <p className="text-gray-700 mb-4">{deck.description}</p>}
                  {deck.tags && deck.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {deck.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={handleLike}
                          className={`flex flex-col items-center p-2 rounded-full hover:bg-gray-100 transition-colors ${
                            isLiked ? "text-red-500" : "text-gray-500"
                          }`}
                          aria-label={isLiked ? "いいねを取り消す" : "いいねする"}
                        >
                          <Heart className="h-6 w-6" fill={isLiked ? "currentColor" : "none"} />
                          <span className="text-xs mt-1">{likeCount}</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{isLiked ? "いいねを取り消す" : "いいねする"}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={handleFavorite}
                          className={`flex flex-col items-center p-2 rounded-full hover:bg-gray-100 transition-colors ${
                            isFavorited ? "text-yellow-500" : "text-gray-500"
                          }`}
                          aria-label={isFavorited ? "お気に入りから削除" : "お気に入りに追加"}
                        >
                          <StarIcon className="h-6 w-6" fill={isFavorited ? "currentColor" : "none"} />
                          <span className="text-xs mt-1">{favoriteCount}</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{isFavorited ? "お気に入りから削除" : "お気に入りに追加"}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <div className="flex flex-col items-center p-2 text-gray-500">
                    <Eye className="h-6 w-6" />
                    <span className="text-xs mt-1">{viewCount}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">デッキ内容</h2>
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="all">全てのカード</TabsTrigger>
                  {Object.keys(cardsByType).map((type) => (
                    <TabsTrigger key={type} value={type}>
                      {type === "unknown" ? "その他" : type}
                    </TabsTrigger>
                  ))}
                </TabsList>
                <TabsContent value="all">{renderCardGrid(cardsWithDetails)}</TabsContent>
                {Object.entries(cardsByType).map(([type, cards]) => (
                  <TabsContent key={type} value={type}>
                    {renderCardGrid(cards)}
                  </TabsContent>
                ))}
              </Tabs>
            </div>

            <div className="mt-6">
              <DeckComments deckId={id} deckTitle={deck.title} />
            </div>
          </main>
          <FooterNavigation />
        </div>
      </AuthProvider>
    </ThemeProvider>
  )
}
