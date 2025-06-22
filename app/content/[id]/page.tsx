"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, ChevronRight, ArrowLeft } from "lucide-react"
import Link from "next/link"
import Header from "@/components/layout/header"
import Footer from "@/components/footer"
import { getDeckPageById } from "@/lib/actions/deck-posts"
import { DeckEvaluation } from "@/components/deck-evaluation"
import { DeckCardsGrid } from "@/components/deck-cards-grid"
import { StrengthsWeaknesses } from "@/components/strengths-weaknesses"
import { HowToPlay } from "@/components/how-to-play"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import DeckComments from "@/components/DeckComments" // DeckCommentsをインポート

export default function PokemonDeckPage() {
  const params = useParams()
  const [deckData, setDeckData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userScore, setUserScore] = useState(5)
  const [evalValue, setEvalValue] = useState(0)
  const [evalCount, setEvalCount] = useState(0)
  const [hasEvaluated, setHasEvaluated] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)

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
            rank: data.tier_rank || "",
            tier: data.tier_name || "",
            descriptions: data.tier_descriptions || [],
          },
          deckStats: {
            accessibility: data.stat_accessibility || 3,
            speed: data.stat_speed || 3,
            power: data.stat_power || 3,
            durability: data.stat_durability || 3,
            stability: data.stat_stability || 3,
          },
          strengthsWeaknessesList: data.strengths_weaknesses_list || [],
          strengthsWeaknessesDetails: data.strengths_weaknesses_details || [],
          howToPlayList: data.how_to_play_list || [],
          howToPlaySteps: data.how_to_play_steps || [],
          evalValue: data.eval_value || 0,
          evalCount: data.eval_count || 0,
        }

        console.log("Converted data for UI:", convertedData) // デバッグ用
        setDeckData(convertedData)
        setEvalValue(convertedData.evalValue)
        setEvalCount(convertedData.evalCount)
      } catch (err) {
        console.error("Failed to fetch deck:", err)
        setError("デッキの取得に失敗しました")
      } finally {
        setIsLoading(false)
      }
    }

    fetchDeck()
  }, [params.id])

  const handleScoreSubmit = async () => {
    if (isSubmitting) return

    console.log("\n🎯 === SCORE SUBMISSION START ===")
    setIsSubmitting(true)

    try {
      // ゲストユーザー用のランダムID生成（セッションベース）
      console.log("🔍 Checking for existing guest user ID...")
      let guestUserId = sessionStorage.getItem("guestUserId")

      if (!guestUserId) {
        console.log("🆕 Generating new guest user ID...")
        guestUserId = crypto.randomUUID()
        sessionStorage.setItem("guestUserId", guestUserId)
        console.log("✅ New guest user ID created:", guestUserId)
      } else {
        console.log("♻️  Using existing guest user ID:", guestUserId)
      }

      const submissionData = {
        deckPageId: params.id,
        userId: guestUserId,
        score: userScore,
      }

      console.log("📤 Submitting evaluation with data:")
      console.log("   - deckPageId:", submissionData.deckPageId)
      console.log("   - userId:", submissionData.userId)
      console.log("   - score:", submissionData.score)
      console.log("   - score type:", typeof submissionData.score)

      console.log("🌐 Making fetch request to /api/deck-evaluation...")
      const fetchStartTime = Date.now()

      const response = await fetch("/api/deck-evaluation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submissionData),
      })

      const fetchEndTime = Date.now()
      console.log(`⏱️  Fetch completed in ${fetchEndTime - fetchStartTime}ms`)

      console.log("📡 Response received:")
      console.log("   - Status:", response.status)
      console.log("   - Status Text:", response.statusText)
      console.log("   - Content-Type:", response.headers.get("content-type"))
      console.log("   - OK:", response.ok)

      // レスポンスを一度だけ読み込む
      console.log("📖 Reading response text...")
      const responseText = await response.text()
      console.log("📄 Raw response text:")
      console.log("   - Length:", responseText.length)
      console.log("   - First 200 chars:", responseText.substring(0, 200))
      console.log("   - Full text:", responseText)

      let responseData
      try {
        console.log("🔄 Parsing JSON...")
        responseData = JSON.parse(responseText)
        console.log("✅ JSON parsed successfully:", responseData)
      } catch (jsonError) {
        console.error("❌ JSON parse failed:")
        console.error("   - Error:", jsonError)
        console.error("   - Response was:", responseText)
        throw new Error(`サーバーエラー (${response.status}): ${responseText.substring(0, 100)}...`)
      }

      if (!response.ok) {
        console.error("❌ Response not OK:")
        console.error("   - Status:", response.status)
        console.error("   - Error data:", responseData)
        throw new Error(responseData.error || `サーバーエラー (${response.status})`)
      }

      console.log("🎉 Success! Updating UI state...")
      console.log("   - New eval value:", responseData.newEvalValue)
      console.log("   - New eval count:", responseData.newEvalCount)

      setEvalValue(responseData.newEvalValue)
      setEvalCount(responseData.newEvalCount)
      setHasEvaluated(true)

      console.log("✅ UI state updated successfully")
      // alert("評価を送信しました！") // この行を削除またはコメントアウト
      setShowSuccessModal(true)
    } catch (error: any) {
      console.error("\n💥 === SCORE SUBMISSION ERROR ===")
      console.error("Error type:", typeof error)
      console.error("Error constructor:", error?.constructor?.name)
      console.error("Error message:", error?.message)
      console.error("Error stack:", error?.stack)
      console.error("=== END SUBMISSION ERROR ===\n")

      alert(`エラー: ${error.message}`)
    } finally {
      console.log("🏁 Setting isSubmitting to false")
      setIsSubmitting(false)
      console.log("=== SCORE SUBMISSION END ===\n")
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100">
        <Header />
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
        <Header />
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
      {/* 成功モーダル */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>評価完了</DialogTitle>
            <DialogDescription>デッキの評価を送信しました！</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" onClick={() => setShowSuccessModal(false)}>
                OK
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Header />

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

            {/* User Rating */}
            <div>
              <h4 className="font-medium mb-4 text-blue-600 border-l-4 border-blue-500 pl-3">みんなの評価</h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-medium">スコア平均</span>
                  <div className="text-right">
                    <div className="text-3xl font-bold">{evalValue.toFixed(1)}</div>
                    <div className="text-sm text-gray-600">/10点({evalCount}件)</div>
                  </div>
                </div>

                <div className="relative mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>1</span>
                    <span>10</span>
                  </div>
                  <div
                    className="w-full bg-gray-200 rounded-full h-4 relative cursor-pointer"
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect()
                      const x = e.clientX - rect.left
                      const percentage = x / rect.width
                      const score = Math.max(1, Math.min(10, Math.round(percentage * 9 + 1)))
                      setUserScore(score)
                    }}
                  >
                    <div
                      className="bg-green-500 h-4 rounded-full transition-all duration-200"
                      style={{ width: `${((userScore - 1) / 9) * 100}%` }}
                    ></div>
                    <div
                      className="absolute top-0 transform -translate-x-1/2 -translate-y-1"
                      style={{ left: `${((userScore - 1) / 9) * 100}%` }}
                    >
                      <div className="bg-green-500 text-white px-2 py-1 rounded text-xs">{userScore}</div>
                    </div>
                  </div>
                </div>

                <div className="text-center text-sm text-gray-600 mb-4">＼採点してスコアグラフを見てみよう／</div>

                <Button
                  className="w-full bg-green-500 hover:bg-green-600 text-white"
                  onClick={handleScoreSubmit}
                  disabled={isSubmitting || hasEvaluated}
                >
                  {isSubmitting ? "送信中..." : hasEvaluated ? "評価済み" : "採点！"}
                </Button>
              </div>
            </div>

            <Button className="w-full bg-green-500 hover:bg-green-600 text-white mb-6">
              ▶ 環境最強デッキランキング
            </Button>
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

        {/* Comments Section - DeckCommentsコンポーネントに置き換え */}
        <Card className="mb-8" id="comments">
          <DeckComments deckId={deckData.id} deckTitle={deckData.title} commentType="deck_page" />
        </Card>
      </div>

      <Footer />
    </div>
  )
}
