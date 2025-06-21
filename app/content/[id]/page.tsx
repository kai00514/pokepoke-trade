"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, ChevronRight, ArrowLeft } from "lucide-react"
import Link from "next/link"
import AuthHeader from "@/components/auth-header"
import Footer from "@/components/footer"
import { getDeckPageById } from "@/lib/actions/deck-posts"
import { DeckEvaluation } from "@/components/deck-evaluation"
import { DeckCardsGrid } from "@/components/deck-cards-grid"
import { StrengthsWeaknesses } from "@/components/strengths-weaknesses"
import { HowToPlay } from "@/components/how-to-play"

export default function PokemonDeckPage() {
  const params = useParams()
  const [deckData, setDeckData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDeck = async () => {
      if (!params.id || typeof params.id !== "string") {
        setError("無効なデッキIDです")
        setIsLoading(false)
        return
      }

      try {
        const result = await getDeckPageById(params.id)
        if (!result.success || !result.data) {
          setError(result.error || "デッキが見つかりません")
          setIsLoading(false)
          return
        }

        const data = result.data
        console.log("Raw data from getDeckPageById (after enrichment):", data) // デバッグ用

        // データベースのデータを安全に変換
        const convertedData = {
          id: data.id,
          title: data.title || "デッキタイトル",
          lastUpdated: new Date(data.updated_at).toLocaleDateString("ja-JP"),
          commentCount: data.comment_count || 0,
          thumbnailImage: data.thumbnail_image_url,
          thumbnailAlt: data.deck_name || "デッキ画像",
          deckBadge: data.deck_name || "デッキ",
          section1Title: "デッキレシピ",
          section2Title: "強み・弱み",
          section3Title: "立ち回り・使い方",
          deckName: data.deck_name || "デッキ",
          energyType: data.energy_type || "無色",
          energyImage: data.energy_image_url,
          // cards_dataはサーバーアクションで既に整形されているため、直接使用
          cards: data.cards_data || [],
          deckDescription: data.deck_description || "",
          evaluationTitle: "デッキ評価",
          // JSONBカラムは直接オブジェクトとしてアクセス
          tierInfo: data.tier_info || {
            rank: "B",
            tier: "Bランク",
            descriptions: ["バランスの取れたデッキ"],
          },
          deckStats: data.deck_stats || {
            accessibility: 3,
            speed: 3,
            power: 3,
            durability: 3,
            stability: 3,
          },
          strengthsWeaknessesList: data.strengths_weaknesses_list || [],
          strengthsWeaknessesDetails: data.strengths_weaknesses_details || [],
          howToPlayList: data.how_to_play_list || [],
          howToPlaySteps: data.how_to_play_steps || [],
        }

        console.log("Converted data for UI:", convertedData) // デバッグ用
        setDeckData(convertedData)
      } catch (err) {
        console.error("Failed to fetch deck:", err)
        setError("デッキの取得に失敗しました")
      } finally {
        setIsLoading(false)
      }
    }

    fetchDeck()
  }, [params.id])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100">
        <AuthHeader />
        <div className="flex justify-center items-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-slate-500">デッキを読み込み中...</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (error || !deckData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100">
        <AuthHeader />
        <div className="text-center py-20">
          <p className="text-red-500 mb-4">{error}</p>
          <Button asChild variant="outline">
            <Link href="/decks">
              <ArrowLeft className="mr-2 h-4 w-4" />
              デッキ一覧に戻る
            </Link>
          </Button>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100">
      <AuthHeader />

      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Button asChild variant="outline">
              <Link href="/decks">
                <ArrowLeft className="mr-2 h-4 w-4" />
                戻る
              </Link>
            </Button>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{deckData.title}</h1>
          <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
            <span>最終更新：{deckData.lastUpdated}</span>
            <div className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded">
              <MessageCircle className="w-4 h-4" />
              <span>{deckData.commentCount}</span>
            </div>
            <Button variant="outline" size="sm" className="text-green-600 border-green-200">
              みんなの最新コメントを読む
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          <div className="relative rounded-lg overflow-hidden">
            <Image
              src={deckData.thumbnailImage || "/placeholder.svg?height=400&width=800&query=デッキ画像"}
              alt={deckData.thumbnailAlt}
              width={800}
              height={400}
              className="w-full h-64 md:h-80 object-cover"
            />
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-blue-500 text-white px-6 py-2 text-lg rounded-full">{deckData.deckBadge}</Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Table of Contents */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>目次</CardTitle>
          </CardHeader>
          <CardContent>
            <nav className="space-y-2">
              {[
                { title: deckData.section1Title, id: "deck-recipe" },
                { title: deckData.section2Title, id: "strengths-weaknesses" },
                { title: deckData.section3Title, id: "how-to-play" },
                { title: "海外大会メタレポートとカード採用率", id: "meta-report" },
                { title: "その他のデッキレシピ", id: "other-recipes" },
                { title: "入れ替え代用カード", id: "substitute-cards" },
              ].map((item, index) => (
                <button
                  key={index}
                  onClick={() => {
                    const element = document.getElementById(item.id)
                    if (element) {
                      element.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                      })
                    }
                  }}
                  className="flex items-center text-blue-600 hover:text-blue-800 transition-colors w-full text-left"
                >
                  <ChevronRight className="w-4 h-4 mr-2" />
                  {item.title}
                </button>
              ))}
            </nav>
          </CardContent>
        </Card>

        {/* Deck Recipe Section */}
        <Card className="mb-8" id="deck-recipe">
          <CardHeader className="bg-gray-700 text-white">
            <CardTitle>{deckData.section1Title}</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4 text-blue-600 border-l-4 border-blue-500 pl-3">デッキレシピ</h3>
              {deckData.cards && deckData.cards.length > 0 ? (
                <DeckCardsGrid
                  deckName={deckData.deckName}
                  energyType={deckData.energyType}
                  energyImage={deckData.energyImage}
                  cards={deckData.cards}
                />
              ) : (
                <div className="text-center text-gray-500 py-8">デッキレシピ情報がありません。</div>
              )}
              {deckData.deckDescription && <p className="text-sm text-gray-600 mt-4">{deckData.deckDescription}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Deck Evaluation */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <DeckEvaluation
              evaluationTitle={deckData.evaluationTitle}
              tierInfo={deckData.tierInfo}
              deckStats={deckData.deckStats}
            />

            <Button className="w-full bg-green-500 hover:bg-green-600 text-white mb-6">
              ▶ 環境最強デッキランキング
            </Button>

            {/* User Rating */}
            <div>
              <h4 className="font-medium mb-4 text-blue-600 border-l-4 border-blue-500 pl-3">みんなの評価</h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-medium">スコア平均</span>
                  <div className="text-right">
                    <div className="text-3xl font-bold">8.8</div>
                    <div className="text-sm text-gray-600">/10点(710件)</div>
                  </div>
                </div>

                <div className="relative mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>5</span>
                    <span>10</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 relative">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: "75%" }}></div>
                    <div className="absolute top-0 left-3/4 transform -translate-x-1/2 -translate-y-1">
                      <div className="bg-green-500 text-white px-2 py-1 rounded text-xs">7.5</div>
                    </div>
                  </div>
                </div>

                <div className="text-center text-sm text-gray-600 mb-4">＼採点してスコアグラフを見てみよう／</div>

                <Button className="w-full bg-green-500 hover:bg-green-600 text-white">採点！</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Strengths and Weaknesses */}
        <Card className="mb-8" id="strengths-weaknesses">
          <CardHeader className="bg-gray-700 text-white">
            <CardTitle>{deckData.section2Title}</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <StrengthsWeaknesses
              strengthsWeaknessesList={deckData.strengthsWeaknessesList}
              strengthsWeaknessesDetails={deckData.strengthsWeaknessesDetails}
            />
          </CardContent>
        </Card>

        {/* How to Play */}
        <Card className="mb-8" id="how-to-play">
          <CardHeader className="bg-gray-700 text-white">
            <CardTitle>{deckData.section3Title}</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <HowToPlay howToPlayList={deckData.howToPlayList} howToPlaySteps={deckData.howToPlaySteps} />
          </CardContent>
        </Card>

        {/* Meta Report - keeping existing structure */}
        <Card className="mb-8" id="meta-report">
          <CardHeader className="bg-gray-700 text-white">
            <CardTitle>海外大会メタレポートとカード採用率</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-center text-gray-500 py-8">メタレポートデータを読み込み中...</div>
          </CardContent>
        </Card>

        {/* Comments Section */}
        <Card className="mb-8" id="comments">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              コメント欄
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="mb-6">
              <textarea
                placeholder="コメントを入力してください..."
                className="w-full p-3 border border-gray-300 rounded-lg resize-none h-24 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-gray-500">最大500文字</span>
                <Button className="bg-blue-500 hover:bg-blue-600 text-white">コメントを投稿</Button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="text-sm font-medium text-gray-700 mb-4">コメント一覧 ({deckData.commentCount}件)</div>

              {/* Sample Comments */}
              {[
                {
                  id: 1,
                  user: "ポケモントレーナー123",
                  time: "2時間前",
                  content: "このデッキ構成、とても参考になりました！実際に使ってみたところ、安定して勝てています。",
                  likes: 12,
                },
                {
                  id: 2,
                  user: "カードマスター",
                  time: "5時間前",
                  content: "グラジオの使い方が上手ですね。序盤の安定感が全然違います。",
                  likes: 8,
                },
                {
                  id: 3,
                  user: "デッキビルダー",
                  time: "1日前",
                  content: "サブアタッカーの選択肢が豊富で、メタに合わせて調整しやすいのが良いですね。",
                  likes: 15,
                },
              ].map((comment) => (
                <div key={comment.id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        {comment.user.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{comment.user}</div>
                        <div className="text-xs text-gray-500">{comment.time}</div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="text-gray-500 hover:text-blue-600">
                      <span className="text-xs">👍 {comment.likes}</span>
                    </Button>
                  </div>
                  <p className="text-sm text-gray-700">{comment.content}</p>
                </div>
              ))}

              <Button variant="outline" className="w-full">
                もっと見る
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  )
}
