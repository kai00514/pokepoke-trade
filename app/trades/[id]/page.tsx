// app/trades/[id]/page.tsx
"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Copy, Send, UserCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import type { Card as CardInfo } from "@/components/detailed-search-modal" // Re-using card type

// Define types for post details and comments
interface Comment {
  id: string
  author: string
  avatar?: string
  text: string
  timestamp: string // e.g., "19日前" or a Date object
}

interface TradePostDetails {
  id: string
  title: string
  status: string
  wantedCards: CardInfo[]
  offeredCards: CardInfo[]
  description: string
  authorNotes?: string // The "testtest" part in the image
  originalPostId: string // The "ID : 111111111111"
  comments: Comment[]
}

// Sample Data (Replace with actual data fetching)
const samplePostDetails: TradePostDetails = {
  id: "1",
  title: "aaaaaa",
  status: "進行中",
  wantedCards: [{ id: "w1", name: "ナゾノクサ", imageUrl: "/placeholder.svg?width=150&height=210" }],
  offeredCards: [
    { id: "o1", name: "ヒトカゲ", imageUrl: "/placeholder.svg?width=150&height=210" },
    { id: "o2", name: "ゼニガメ", imageUrl: "/placeholder.svg?width=150&height=210" },
  ],
  description: "This is the main description of the trade post, if available.",
  authorNotes: "testtest",
  originalPostId: "111111111111",
  comments: [
    { id: "c1", author: "ゲスト", text: "hello", timestamp: "19日前" },
    { id: "c2", author: "ゲスト", text: "aaaaaa", timestamp: "19日前" },
    { id: "c3", author: "ゲスト", text: "hellohello", timestamp: "19日前" },
    { id: "c4", author: "ゲスト", text: "hello", timestamp: "19日前" },
    { id: "c5", author: "ゲスト", text: "aaaaaaaaaa", timestamp: "19日前" },
  ],
}

export default function TradeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [post, setPost] = useState<TradePostDetails | null>(null)
  const [newComment, setNewComment] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  const postId = params.id as string

  useEffect(() => {
    // Simulate data fetching
    if (postId) {
      setIsLoading(true)
      setTimeout(() => {
        // In a real app, fetch post data using postId
        // For now, use sample data if postId matches, or handle not found
        if (postId === samplePostDetails.id) {
          setPost(samplePostDetails)
        } else {
          setPost(null) // Or redirect to a 404 page
        }
        setIsLoading(false)
      }, 500)
    }
  }, [postId])

  const handleCopyToClipboard = () => {
    if (post?.originalPostId) {
      navigator.clipboard.writeText(post.originalPostId)
      toast({
        title: "コピーしました",
        description: `ID: ${post.originalPostId} をクリップボードにコピーしました。`,
      })
    }
  }

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    // Simulate comment submission
    const submittedComment: Comment = {
      id: `c${Date.now()}`,
      author: "自分", // Or logged-in user
      text: newComment.trim(),
      timestamp: "たった今",
    }
    setPost((prevPost) => (prevPost ? { ...prevPost, comments: [...prevPost.comments, submittedComment] } : null))
    setNewComment("")
    toast({
      title: "コメントを投稿しました",
    })
  }

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8 flex justify-center items-center">
          <p className="text-slate-500">読み込み中...</p>
        </main>
        <Footer />
      </div>
    )
  }

  if (!post) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">投稿が見つかりません</h1>
          <Button onClick={() => router.push("/")}>タイムラインに戻る</Button>
        </main>
        <Footer />
      </div>
    )
  }

  const renderCardList = (cards: CardInfo[], title: string) => (
    <div>
      <h2 className="text-lg font-semibold text-slate-700 mb-2">{title}</h2>
      {cards.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {cards.map((card) => (
            <div key={card.id} className="border rounded-lg p-2 bg-slate-50 text-center shadow-sm">
              <Image
                src={card.imageUrl || "/placeholder.svg?width=100&height=140"}
                alt={card.name}
                width={100}
                height={140}
                className="rounded-md object-contain mx-auto mb-1 aspect-[5/7]"
              />
              <p className="text-xs font-medium text-slate-600 truncate">{card.name}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-500">該当なし</p>
      )}
    </div>
  )

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <Link href="/" className="inline-flex items-center text-sm text-purple-600 hover:text-purple-700 mb-6 group">
          <ArrowLeft className="h-4 w-4 mr-1 transition-transform group-hover:-translate-x-1" />
          タイムラインに戻る
        </Link>

        {/* Trade Post Details Card */}
        <div className="bg-white p-6 sm:p-8 rounded-lg shadow-xl mb-8">
          <div className="flex justify-between items-start mb-4">
            <h1 className="text-2xl font-bold text-slate-800">{post.title}</h1>
            <Badge variant="outline" className="bg-sky-100 text-sky-700 border-sky-300 whitespace-nowrap">
              {post.status}
            </Badge>
          </div>

          <div className="space-y-6 mb-6">
            {renderCardList(post.wantedCards, "求めるカード")}
            {renderCardList(post.offeredCards, "譲りたいカード")}
          </div>

          {post.authorNotes && (
            <div className="bg-slate-100 p-4 rounded-md mb-6">
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{post.authorNotes}</p>
            </div>
          )}

          <div className="flex justify-between items-center bg-slate-100 p-3 rounded-md">
            <p className="text-sm text-slate-600">ID : {post.originalPostId}</p>
            <Button variant="outline" size="sm" onClick={handleCopyToClipboard} className="text-xs">
              <Copy className="mr-1.5 h-3 w-3" />
              コピー
            </Button>
          </div>
        </div>

        {/* Comments Section */}
        <div className="bg-white rounded-lg shadow-xl">
          <div className="bg-purple-600 text-white p-4 rounded-t-lg">
            <h2 className="text-xl font-semibold">コメント</h2>
          </div>

          <div className="p-4 sm:p-6 space-y-4">
            {post.comments.length > 0 ? (
              post.comments.map((comment) => (
                <div
                  key={comment.id}
                  className="flex items-start space-x-3 pb-4 border-b border-slate-100 last:border-b-0 last:pb-0"
                >
                  {comment.avatar ? (
                    <Image
                      src={comment.avatar || "/placeholder.svg"}
                      alt={comment.author}
                      width={36}
                      height={36}
                      className="rounded-full"
                    />
                  ) : (
                    <UserCircle className="h-9 w-9 text-slate-400 flex-shrink-0" />
                  )}
                  <div className="flex-grow">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-700">{comment.author}</span>
                      <span className="text-xs text-slate-400">{comment.timestamp}</span>
                    </div>
                    <p className="text-sm text-slate-600 mt-0.5 whitespace-pre-wrap">{comment.text}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500 text-center py-4">まだコメントはありません。</p>
            )}
          </div>

          <form
            onSubmit={handleCommentSubmit}
            className="p-4 sm:p-6 border-t border-slate-200 bg-slate-50 rounded-b-lg"
          >
            <div className="flex items-center space-x-2">
              <Input
                type="text"
                placeholder="コメントを入力してください..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-grow bg-white"
              />
              <Button
                type="submit"
                className="bg-purple-600 hover:bg-purple-700 text-white"
                disabled={!newComment.trim()}
              >
                <Send className="h-4 w-4 mr-0 sm:mr-2" />
                <span className="hidden sm:inline">投稿</span>
              </Button>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  )
}
