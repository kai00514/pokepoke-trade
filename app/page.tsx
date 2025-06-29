"use client"

import { useState, useEffect, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import Header from "@/components/layout/header" // AuthHeader から Header に変更
import Footer from "@/components/footer"
import TradePostCard from "@/components/trade-post-card"
import AdPlaceholder from "@/components/ad-placeholder"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PlusCircle, Search, Loader2 } from "lucide-react"
import DetailedSearchModal from "@/components/detailed-search-modal"
import type { Card as SelectedCardType } from "@/components/detailed-search-modal"
import { getTradePostsWithCards } from "@/lib/actions/trade-actions"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { AuthDebug } from "@/components/auth-debug"

export default function TradeBoardPage() {
  const [isDetailedSearchOpen, setIsDetailedSearchOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [tradePosts, setTradePosts] = useState<any[]>([])
  const [searchKeyword, setSearchKeyword] = useState("")
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()

  // URLパラメータのクリーンアップ
  useEffect(() => {
    const code = searchParams.get("code")
    if (code) {
      console.log("🧹 Cleaning up URL parameters")
      const url = new URL(window.location.href)
      url.searchParams.delete("code")
      window.history.replaceState({}, "", url.toString())
    }
  }, [searchParams])

  const fetchTradePosts = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await getTradePostsWithCards(20, 0)
      if (result.success) {
        setTradePosts(result.posts)
      } else {
        toast({
          title: "データ取得エラー",
          description: result.error || "投稿の取得に失敗しました。",
          variant: "destructive",
        })
        setTradePosts([])
      }
    } catch (error) {
      console.error("Error fetching trade posts:", error)
      toast({
        title: "エラー",
        description: "予期しないエラーが発生しました。",
        variant: "destructive",
      })
      setTradePosts([])
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchTradePosts()
  }, [fetchTradePosts])

  const handleDetailedSearchSelectionComplete = (selectedCards: SelectedCardType[]) => {
    console.log("Selected cards from detailed search:", selectedCards)
    setIsDetailedSearchOpen(false)
  }

  const filteredPosts = tradePosts.filter((post) => {
    if (!searchKeyword.trim()) return true
    const keyword = searchKeyword.toLowerCase()
    const titleMatch = post.title?.toLowerCase().includes(keyword)
    const wantedCardNameMatch = post.wantedCard?.name?.toLowerCase().includes(keyword)
    const offeredCardNameMatch = post.offeredCard?.name?.toLowerCase().includes(keyword)
    return titleMatch || wantedCardNameMatch || offeredCardNameMatch
  })

  const handleCreatePostClick = () => {
    router.push("/trades/create")
  }

  console.log("📄 TradeBoardPage rendering with Header component")

  return (
    <div className="flex flex-col min-h-screen">
      <Header /> {/* AuthHeader から Header に変更 */}
      <main className="flex-grow container mx-auto px-2 sm:px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <aside className="w-full lg:w-1/5 space-y-6 hidden lg:block">
            <AdPlaceholder title="広告スペース" className="h-64" />
            <AdPlaceholder title="自己紹介バナー" className="h-48" />
          </aside>

          <section className="w-full lg:flex-grow">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold text-slate-800">ポケリンクトレード掲示板</h1>
              <p className="text-slate-600">ポケモンカードの交換相手を見つけよう！</p>
            </div>

            <div className="mb-8 flex justify-center">
              <Button
                variant="default"
                className="bg-[#EA585C] hover:bg-[#d44a4f] text-white rounded-md shadow-sm"
                style={{ padding: "0.625rem 1.25rem" }}
                onClick={handleCreatePostClick}
              >
                <div className="flex items-center justify-center">
                  <PlusCircle className="h-5 w-5 mr-2" />
                  <span className="text-sm font-medium">トレード希望投稿を作成</span>
                </div>
              </Button>
            </div>

            <div className="mb-6 p-4 bg-white rounded-lg shadow">
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  type="text"
                  placeholder="キーワード検索"
                  className="flex-grow"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                />
                <Button variant="default" className="bg-violet-500 hover:bg-violet-600 text-white">
                  <Search className="mr-2 h-4 w-4 sm:hidden" /> 検索
                </Button>
                <Button
                  variant="outline"
                  className="bg-slate-200 text-slate-700 hover:bg-slate-300"
                  onClick={() => setIsDetailedSearchOpen(true)}
                >
                  詳細検索
                </Button>
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="h-10 w-10 animate-spin text-purple-600" />
              </div>
            ) : filteredPosts.length > 0 ? (
              <div className="space-y-6">
                {filteredPosts.map((post) => (
                  <TradePostCard key={post.id} post={post} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 text-slate-500">
                {searchKeyword ? "検索条件に一致する投稿がありません。" : "投稿がありません。"}
              </div>
            )}
          </section>

          <aside className="w-full lg:w-1/5 space-y-6 hidden lg:block">
            <AdPlaceholder title="広告スペース" className="h-64" />
            <AdPlaceholder title="広告スペース" className="h-40" />
          </aside>
        </div>
      </main>
      <Footer />
      <DetailedSearchModal
        isOpen={isDetailedSearchOpen}
        onOpenChange={setIsDetailedSearchOpen}
        onSelectionComplete={handleDetailedSearchSelectionComplete}
        modalTitle="カード詳細検索"
      />
      <AuthDebug />
    </div>
  )
}
