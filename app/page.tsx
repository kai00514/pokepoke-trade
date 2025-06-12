"use client"

import { useState } from "react"
import Link from "next/link" // Ensure Link is imported
import AuthHeader from "@/components/auth-header"
import Footer from "@/components/footer"
import TradePostCard from "@/components/trade-post-card"
import AdPlaceholder from "@/components/ad-placeholder"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PlusCircle, Search } from "lucide-react"
import DetailedSearchModal from "@/components/detailed-search-modal"
import type { Card as SelectedCardType } from "@/components/detailed-search-modal"

const tradePostsData = [
  {
    id: "1",
    title: "aaaaaa",
    date: "2025/05/30",
    status: "進行中",
    wantedCard: {
      name: "ナゾノクサ",
      image: "/placeholder.svg?width=100&height=140",
    },
    offeredCard: {
      name: "ヒトカゲ",
      image: "/placeholder.svg?width=100&height=140",
    },
    comments: 0,
    postId: "未設定",
  },
  {
    id: "2",
    title: "aaa",
    date: "2025/05/18",
    status: "進行中",
    wantedCard: {
      name: "ナゾノクサ",
      image: "/placeholder.svg?width=100&height=140",
    },
    offeredCard: {
      name: "シェルダー",
      image: "/placeholder.svg?width=100&height=140",
    },
    comments: 2,
    postId: "DEF456",
  },
]

export default function TradeBoardPage() {
  const [isDetailedSearchOpen, setIsDetailedSearchOpen] = useState(false)

  const handleDetailedSearchSelectionComplete = (selectedCards: SelectedCardType[]) => {
    console.log("Selected cards from detailed search:", selectedCards)
    setIsDetailedSearchOpen(false)
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <AuthHeader />
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
              {/* Ensure this Button uses asChild and Link correctly points to /trades/create */}
              <Button
                asChild
                variant="default"
                className="bg-[#EA585C] hover:bg-[#d44a4f] text-white rounded-md shadow-sm"
                style={{ padding: "0.625rem 1.25rem" }}
              >
                <Link href="/trades/create">
                  <div className="flex items-center justify-center">
                    <PlusCircle className="h-5 w-5 mr-2" />
                    <span className="text-sm font-medium">トレード希望投稿を作成</span>
                  </div>
                </Link>
              </Button>
            </div>

            <div className="mb-6 p-4 bg-white rounded-lg shadow">
              <div className="flex flex-col sm:flex-row gap-2">
                <Input type="text" placeholder="キーワード検索" className="flex-grow" />
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

            <div className="space-y-6">
              {tradePostsData.map((post) => (
                <TradePostCard key={post.id} post={post} />
              ))}
            </div>
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
    </div>
  )
}
