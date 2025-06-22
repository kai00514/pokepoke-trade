"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { Heart, StarIcon, ArrowLeft, User, Calendar, MessageCircle, Loader2 } from 'lucide-react'
import { useAuth } from "@/contexts/auth-context"
import { getDeckById, likeDeck, unlikeDeck, favoriteDeck, unfavoriteDeck } from "@/lib/services/deck-service"
import { fetchCardDetailsByIds } from "@/lib/card-api"
import { Button } from "@/components/ui/button"
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
import { LoginPrompt } from "@/components/login-prompt"

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
  const [commentCount, setCommentCount] = useState(0)
  const [isLikeLoading, setIsLikeLoading] = useState(false)
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const { toast } = useToast()

  // "create"というIDが渡された場合、/decks/createにリダイレクト
  useEffect(() => {
    if (id === "create") {
      console.log("Detected 'create' as ID, redirecting to /decks/create")
      router.replace("/decks/create")
    }
  }, [id, router])

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

  const fetchDeckData = async () => {
    // "create"の場合はリダイレクトされるため、ここでは処理しない
    if (id === "create") {
      setIsLoading(false)
      return
    }

    console.log("Starting fetchDeckData for deck ID:", id)
    setIsLoading(true)
    setError(null)
    try {
      const { data, error } = await getDeckById(id)
      if (error || !data) {
        console.error("Failed to fetch deck:", error)
        setError(error || "デッキの取得に失敗しました")
        return
      }

      console.log("Setting deck data:", data)
      setDeck(data)
      setLikeCount(data.like_count || 0)
      setFavoriteCount(data.favorite_count || 0)
      setCommentCount(data.comment_count || 0)

      console.log(
        "Set counts - Like:",
        data.like_count,
        "Favorite:",
        data.favorite_count,
        "Comment:",
        data.comment_count,
      )

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
    } catch (err) {
      console.error("Error fetching deck:", err)
      setError("デッキの読み込み中にエラーが発生しました")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // idが"create"でない場合にのみデータをフェッチ
    if (!authLoading && id !== "create") {
      fetchDeckData()
    }
  }, [id, authLoading])

  const handleLike = async () => {
    console.log("❤️ handleLike called:", { isLiked, likeCount, user: user?.id })

    // いいねはログインしていなくても実行可能
    if (isLikeLoading) return

    setIsLikeLoading(true)
    const originalIsLiked = isLiked
    const originalLikeCount = likeCount

    // UIを即座に更新
    setIsLiked(!isLiked)
    setLikeCount((prev) => (originalIsLiked ? prev - 1 : prev + 1))

    try {
      const action = originalIsLiked ? unlikeDeck : likeDeck
      console.log("Calling action:", originalIsLiked ? "unlike" : "like")

      const { error } = await action(id)

      if (error) {
        console.error("Action failed:", error)
        toast({ title: "エラー", description: error, variant: "destructive" })
        // エラー時はUIの状態を元に戻す
        setIsLiked(originalIsLiked)
        setLikeCount(originalLikeCount)
      } else {
        console.log("Action successful, fetching updated data...")
        // 少し待ってから最新データを取得
        setTimeout(async () => {
          const { data: updatedDeck } = await getDeckById(id)
          if (updatedDeck) {
            console.log("Updated deck data:", updatedDeck)
            setLikeCount(updatedDeck.like_count || 0)
            console.log("Updated like count to:", updatedDeck.like_count)
          }
        }, 100)
      }
    } catch (err) {
      console.error("Error toggling like:", err)
      toast({ title: "エラー", description: "操作に失敗しました", variant: "destructive" })
      setIsLiked(originalIsLiked)
      setLikeCount(originalLikeCount)
    } finally {
      setIsLikeLoading(false)
    }
  }

  const handleFavorite = async () => {
    console.log("⭐ handleFavorite called:", { isFavorited, favoriteCount, user: user?.id })

    // お気に入りは会員ユーザーのみ実行可能
    if (!user) {
      console.log("⭐ User not logged in - showing login prompt")
      setShowLoginPrompt(true)
      return
    }

    if (isFavoriteLoading) return

    setIsFavoriteLoading(true)
    const originalIsFavorited = isFavorited
    const originalFavoriteCount = favoriteCount

    // UIを即座に更新
    setIsFavorited(!isFavorited)
    setFavoriteCount((prev) => (originalIsFavorited ? prev - 1 : prev + 1))

    try {
      const action = originalIsFavorited ? unfavoriteDeck : favoriteDeck
      console.log("Calling action:", originalIsFavorited ? "unfavorite" : "favorite")

      const { error } = await action(id)

      if (error) {
        console.error("Action failed:", error)
        toast({ title: "エラー", description: error, variant: "destructive" })
        // エラー時はUIの状態を元に戻す
        setIsFavorited(originalIsFavorited)
        setFavoriteCount(originalFavoriteCount)
      } else {
        console.log("Action successful, fetching updated data...")
        // 少し待ってから最新データを取得
        setTimeout(async () => {
          const { data: updatedDeck } = await getDeckById(id)
          if (updatedDeck) {
            console.log("Updated deck data:", updatedDeck)
            setFavoriteCount(updatedDeck.favorite_count || 0)
            console.log("Updated favorite count to:", updatedDeck.favorite_count)
          }
        }, 100)
      }
    } catch (err) {
      console.error("Error toggling favorite:", err)
      toast({ title: "エラー", description: "操作に失敗しました", variant: "destructive" })
      setIsFavorited(originalIsFavorited)
      setFavoriteCount(originalFavoriteCount)
    } finally {
      setIsFavoriteLoading(false)
    }
  }

  // idが"create"の場合は、リダイレクト処理が完了するまで何も表示しない
  if (id === "create") {
    return null
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

  const renderCardGrid = (cardsToRender: (CardData & { uniqueKey: string })[]) => {
    const midPoint = Math.ceil(cardsToRender.length / 2)
    const row1Cards = cardsToRender.slice(0, midPoint)
    const row2Cards = cardsToRender.slice(midPoint)

    const renderCardItem = (card: CardData & { uniqueKey: string }) => (
      <div key={card.uniqueKey} className="w-[80px] sm:w-[90px] md:w-[100px] flex flex-col items-center flex-shrink-0">
        <div className="w-full aspect-[5/7] bg-gray-100 rounded-md overflow-hidden border border-gray-200 shadow-sm mb-1.5">
          <CardDisplay cardId={card.card_id} useThumb={false} fill objectFit="contain" />
        </div>
        <p className="text-xs font-medium text-center truncate w-full text-gray-700">{card.name}</p>
      </div>
    )

    return (
      <div className="overflow-x-auto pb-2">
        <div className="inline-flex flex-col gap-y-4" style={{ minWidth: "max-content" }}>
          <div className="flex gap-x-3">{row1Cards.map(renderCardItem)}</div>
          {row2Cards.length > 0 && <div className="flex gap-x-3">{row2Cards.map(renderCardItem)}</div>}
        </div>
      </div>
    )
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <main className="container mx-auto px-4 py-6 pb-24">
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
                  </div>
                  {deck.description && <p className="text-gray-700 mb-4">{deck.description}</p>}
                </div>

                <div className="flex items-center gap-4">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={handleLike}
                          disabled={isLikeLoading}
                          className={`flex flex-col items-center p-2 rounded-full hover:bg-gray-100 transition-colors ${
                            isLiked ? "text-red-500" : "text-gray-500"
                          } ${isLikeLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                          aria-label={isLiked ? "いいねを取り消す" : "いいねする"}
                        >
                          {isLikeLoading ? (
                            <Loader2 className="h-6 w-6 animate-spin" />
                          ) : (
                            <Heart className="h-6 w-6" fill={isLiked ? "currentColor" : "none"} />
                          )}
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
                          disabled={isFavoriteLoading}
                          className={`flex flex-col items-center p-2 rounded-full hover:bg-gray-100 transition-colors ${
                            isFavorited ? "text-yellow-500" : "text-gray-500"
                          } ${isFavoriteLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                          aria-label={isFavorited ? "お気に入りから削除" : "お気に入りに追加"}
                        >
                          {isFavoriteLoading ? (
                            <Loader2 className="h-6 w-6 animate-spin" />
                          ) : (
                            <StarIcon className="h-6 w-6" fill={isFavorited ? "currentColor" : "none"} />
                          )}
                          <span className="text-xs mt-1">{favoriteCount}</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{isFavorited ? "お気に入りから削除" : "お気に入りに追加"}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <div className="flex flex-col items-center p-2 text-gray-500">
                    <MessageCircle className="h-6 w-6" />
                    <span className="text-xs mt-1">{commentCount}</span>
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
                      <Image
                        src={`/images/types/${type}.png`}
                        alt={type}
                        width={24}
                        height={24}
                        className="inline-block mr-1"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder.svg?width=24&height=24"
                          e.currentTarget.alt = "不明なタイプ"
                        }}
                      />
                      <span className="sr-only">{type}</span>
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
              <DeckComments deckId={id} deckTitle={deck.title} commentType="deck" />
            </div>
          </main>
          <div className="fixed bottom-0 left-0 right-0 z-50">
            <FooterNavigation />
          </div>
        </div>

        {/* ログイン誘導モーダル */}
        <LoginPrompt
          open={showLoginPrompt}
          setOpen={setShowLoginPrompt}
          title="お気に入り機能は会員限定です"
          description="お気に入りのデッキを保存するにはログインしてください。"
        />
      </AuthProvider>
    </ThemeProvider>
  )
}
