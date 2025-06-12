"use client"

import type React from "react"

import Link from "next/link" // Add Link import
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Copy, MessageSquare } from "lucide-react"
import { useToast } from "@/components/ui/use-toast" // Add useToast for copy functionality

type CardInfo = {
  name: string
  image: string
}

type TradePost = {
  id: string // This id will be used for the route
  title: string
  date: string
  status: string
  wantedCard: CardInfo
  offeredCard: CardInfo // For simplicity, keeping this as single for the card display
  // Detail page will handle multiple if data structure allows
  comments: number
  postId: string // This is the "display ID" or "originalPostId"
}

interface TradePostCardProps {
  post: TradePost
}

export default function TradePostCard({ post }: TradePostCardProps) {
  const { toast } = useToast()

  const handleCopyToClipboard = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card click when copying ID
    navigator.clipboard.writeText(post.postId)
    toast({
      title: "コピーしました",
      description: `ID: ${post.postId} をクリップボードにコピーしました。`,
    })
  }

  return (
    <Card className="w-full shadow-lg hover:shadow-xl transition-shadow duration-200">
      <Link href={`/trades/${post.id}`} className="block">
        {" "}
        {/* Entire card links to detail page */}
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl font-semibold text-slate-800 group-hover:text-purple-600 transition-colors">
                {post.title}
              </CardTitle>
              <p className="text-xs text-slate-500">{post.date}</p>
            </div>
            <Badge variant="outline" className="bg-sky-100 text-sky-700 border-sky-300 whitespace-nowrap">
              {post.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-2 pb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-4">
            {/* Wanted Card */}
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-blue-600">求めるカード</h3>
              <div className="border-t-2 border-blue-500 pt-2 flex flex-col items-center sm:items-start">
                <Image
                  src={post.wantedCard.image || "/placeholder.svg?width=100&height=140&query=wanted+card+placeholder"}
                  alt={post.wantedCard.name}
                  width={100}
                  height={140}
                  className="rounded-md object-contain border bg-slate-100 mb-1"
                />
                <p className="text-sm font-semibold text-slate-700 text-center sm:text-left">{post.wantedCard.name}</p>
              </div>
            </div>

            {/* Offered Card */}
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-red-600">譲れるカード</h3>
              <div className="border-t-2 border-red-500 pt-2 flex flex-col items-center sm:items-start">
                <Image
                  src={post.offeredCard.image || "/placeholder.svg?width=100&height=140&query=offered+card+placeholder"}
                  alt={post.offeredCard.name}
                  width={100}
                  height={140}
                  className="rounded-md object-contain border bg-slate-100 mb-1"
                />
                <p className="text-sm font-semibold text-slate-700 text-center sm:text-left">{post.offeredCard.name}</p>
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
            onClick={handleCopyToClipboard} // Use updated handler
          >
            <Copy className="mr-1 h-3 w-3" /> コピー
          </Button>
        </div>
        <Button
          asChild // Make button behave as a Link
          variant="default"
          size="sm"
          className="bg-violet-500 hover:bg-violet-600 text-white text-xs h-auto py-1.5 px-3"
        >
          <Link href={`/trades/${post.id}`}>
            {" "}
            {/* Link to detail page */}
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
