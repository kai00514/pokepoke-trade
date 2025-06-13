"use client"

import type React from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Copy, MessageSquare, UserCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

type CardInfo = {
  name: string
  image: string // Ensure this is always a string, even if it's a placeholder URL
}

type TradePost = {
  id: string
  title: string
  date: string
  status: string
  wantedCard?: CardInfo // Make optional or ensure it's always populated
  offeredCard?: CardInfo // Make optional or ensure it's always populated
  comments: number
  postId: string
  username?: string
  avatarUrl?: string | null
  rawData?: any
}

interface TradePostCardProps {
  post: TradePost
}

export default function TradePostCard({ post }: TradePostCardProps) {
  const { toast } = useToast()

  const handleCopyToClipboard = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    navigator.clipboard.writeText(post.postId)
    toast({
      title: "コピーしました",
      description: `ID: ${post.postId} をクリップボードにコピーしました。`,
    })
  }

  // 複数カード表示用
  const wantedCards = post.rawData?.wantedCards || []
  const offeredCards = post.rawData?.offeredCards || []

  return (
    <Card className="w-full shadow-lg hover:shadow-xl transition-shadow duration-200">
      <Link href={`/trades/${post.id}`} className="block">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl font-semibold text-slate-800 group-hover:text-purple-600 transition-colors">
                {post.title}
              </CardTitle>
              <div className="flex items-center mt-1">
                {post.avatarUrl ? (
                  <Image
                    src={post.avatarUrl || "/placeholder.svg"}
                    alt={post.username || "ユーザー"}
                    width={20}
                    height={20}
                    className="rounded-full mr-2"
                  />
                ) : (
                  <UserCircle className="h-5 w-5 text-slate-400 mr-2" />
                )}
                <p className="text-xs text-slate-500">
                  {post.username || "ユーザー"} • {post.date}
                </p>
              </div>
            </div>
            <Badge
              variant="outline"
              className={`whitespace-nowrap ${
                post.status === "募集中"
                  ? "bg-green-100 text-green-700 border-green-300"
                  : post.status === "進行中"
                    ? "bg-amber-100 text-amber-700 border-amber-300"
                    : post.status === "完了"
                      ? "bg-blue-100 text-blue-700 border-blue-300"
                      : "bg-gray-100 text-gray-700 border-gray-300"
              }`}
            >
              {post.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-2 pb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-4">
            {/* Wanted Cards 横スクロール表示 */}
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-blue-600">求めるカード</h3>
              <div className="border-t-2 border-blue-500 pt-2 flex flex-nowrap overflow-x-auto gap-2 items-center scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
                {wantedCards.length > 0 ? (
                  wantedCards.map((card: any) => (
                    <div key={card.id} className="flex-shrink-0 flex flex-col items-center">
                      <Image
                        src={card.imageUrl || "/placeholder.svg?width=100&height=140"}
                        alt={card.name}
                        width={100}
                        height={140}
                        className="rounded-md object-contain border bg-slate-100 mb-1"
                      />
                      <p className="text-xs font-semibold text-slate-700 text-center max-w-[100px] truncate">{card.name}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500">該当なし</p>
                )}
              </div>
            </div>

            {/* Offered Cards 横スクロール表示 */}
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-red-600">譲れるカード</h3>
              <div className="border-t-2 border-red-500 pt-2 flex flex-nowrap overflow-x-auto gap-2 items-center scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
                {offeredCards.length > 0 ? (
                  offeredCards.map((card: any) => (
                    <div key={card.id} className="flex-shrink-0 flex flex-col items-center">
                      <Image
                        src={card.imageUrl || "/placeholder.svg?width=100&height=140"}
                        alt={card.name}
                        width={100}
                        height={140}
                        className="rounded-md object-contain border bg-slate-100 mb-1"
                      />
                      <p className="text-xs font-semibold text-slate-700 text-center max-w-[100px] truncate">{card.name}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500">該当なし</p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-slate-50 p-2 rounded text-sm text-slate-600 mb-3">
            {post.comments > 0 ? `コメント: ${post.comments}件` : "コメントはありません"}
          </div>
        </CardContent>
      </Link>
      <CardFooter className="bg-slate-50/50 px-4 py-3 flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-4 rounded-b-lg">
        <div className="flex items-center gap-2">
          <p className="text-xs text-slate-500">ID: {post.postId}</p>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-auto py-1 px-2 text-slate-600 hover:bg-slate-200"
            onClick={handleCopyToClipboard}
          >
            <Copy className="mr-1 h-3 w-3" /> コピー
          </Button>
        </div>
        <Button
          asChild
          variant="default"
          size="sm"
          className="bg-violet-500 hover:bg-violet-600 text-white text-xs h-auto py-1.5 px-3"
        >
          <Link href={`/trades/${post.id}`}>
            <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
            詳細
            {post.comments > 0 && (
              <span className="ml-1.5 bg-white text-violet-600 text-xs font-bold px-1.5 py-0.5 rounded-full">
                {post.comments}
              </span>
            )}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
