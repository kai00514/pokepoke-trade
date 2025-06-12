"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { ArrowLeft, Send, Loader2, AlertCircle } from "lucide-react"
import { getTradePostDetailsById, addCommentToTradePost } from "@/lib/actions/trade-actions"
import { createBrowserClient } from "@/lib/supabase/client"
import AuthHeader from "@/components/auth-header"
import Footer from "@/components/footer"

interface Comment {
  id: string
  author: string
  avatar: string | null
  text: string
  timestamp: string
}

interface TradePostDetails {
  id: string
  title: string
  status: string
  wantedCards: {
    id: string
    name: string
    imageUrl: string
    isPrimary?: boolean
  }[]
  offeredCards: {
    id: string
    name: string
    imageUrl: string
  }[]
  description: string
  authorNotes: string
  originalPostId: string
  comments: Comment[]
  author: {
    username: string
    avatarUrl: string | null
  }
  createdAt: string
}

export default function TradePostDetailPage({ params }: { params: { id: string } }) {
  const [post, setPost] = useState<TradePostDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [comment, setComment] = useState("")
  const [submittingComment, setSubmittingComment] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createBrowserClient()

  // Skip fetching for the "create" route
  const shouldFetchPost = params.id !== "create"

  useEffect(() => {
    // Redirect to the create page if the ID is "create"
    if (params.id === "create") {
      router.push("/trades/create")
      return
    }

    const fetchPostDetails = async () => {
      try {
        setLoading(true)
        const result = await getTradePostDetailsById(params.id)
        if (result.success && result.post) {
          setPost(result.post)
        } else {
          setError(result.error || "投稿の取得に失敗しました。")
        }
      } catch (err) {
        console.error("Error fetching post details:", err)
        setError("予期しないエラーが発生しました。")
      } finally {
        setLoading(false)
      }
    }

    if (shouldFetchPost) {
      fetchPostDetails()
    }
  }, [params.id, router, shouldFetchPost])

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession()
      setIsAuthenticated(!!data.session)
    }

    checkAuth()

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session)
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [supabase.auth])

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!comment.trim()) {
      toast({
        title: "コメントエラー",
        description: "コメント内容を入力してください。",
        variant: "destructive",
      })
      return
    }

    if (!isAuthenticated) {
      toast({
        title: "認証エラー",
        description: "コメントするにはログインが必要です。",
        variant: "destructive",
      })
      return
    }

    try {
      setSubmittingComment(true)
      const result = await addCommentToTradePost(params.id, comment)

      if (result.success) {
        toast({
          title: "コメント投稿成功",
          description: "コメントが投稿されました。",
        })
        setComment("")

        // Refresh post data to show the new comment
        const updatedResult = await getTradePostDetailsById(params.id)
        if (updatedResult.success && updatedResult.post) {
          setPost(updatedResult.post)
        }
      } else {
        toast({
          title: "コメントエラー",
          description: result.error || "コメントの投稿に失敗しました。",
          variant: "destructive",
        })
      }
    } catch (err) {
      console.error("Error submitting comment:", err)
      toast({
        title: "エラー",
        description: "予期しないエラーが発生しました。",
        variant: "destructive",
      })
    } finally {
      setSubmittingComment(false)
    }
  }

  // Skip rendering for the "create" route
  if (params.id === "create") {
    return null
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-100">
        <AuthHeader />
        <main className="flex-grow container mx-auto px-4 py-8 flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-purple-600" />
        </main>
        <Footer />
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-100">
        <AuthHeader />
        <main className="flex-grow container mx-auto px-4 py-8">
          <Link href="/" className="inline-flex items-center text-sm text-purple-600 hover:text-purple-700 mb-6">
            <ArrowLeft className="h-4 w-4 mr-1" />
            タイムラインに戻る
          </Link>

          <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto flex flex-col items-center justify-center">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h1 className="text-xl font-bold text-slate-800 mb-2">エラーが発生しました</h1>
            <p className="text-slate-600 mb-6">{error || "投稿の取得に失敗しました。"}</p>
            <Button asChild>
              <Link href="/">タイムラインに戻る</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-100">
      <AuthHeader />
      <main className="flex-grow container mx-auto px-4 py-8">
        <Link href="/" className="inline-flex items-center text-sm text-purple-600 hover:text-purple-700 mb-6">
          <ArrowLeft className="h-4 w-4 mr-1" />
          タイムラインに戻る
        </Link>

        <div className="bg-white p-6 rounded-lg shadow-md max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">{post.title}</h1>
              <div className="flex items-center mt-2">
                <div className="flex items-center">
                  {post.author.avatarUrl ? (
                    <Image
                      src={post.author.avatarUrl || "/placeholder.svg"}
                      alt={post.author.username}
                      width={24}
                      height={24}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-purple-200 flex items-center justify-center">
                      <span className="text-xs font-medium text-purple-700">
                        {post.author.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <span className="text-sm text-slate-600 ml-2">{post.author.username}</span>
                </div>
                <span className="text-xs text-slate-500 ml-4">投稿日: {post.createdAt}</span>
                <span className="text-xs font-medium ml-4 px-2 py-1 rounded bg-blue-100 text-blue-800">
                  {post.status}
                </span>
              </div>
            </div>
            <div className="mt-4 md:mt-0">
              <span className="text-xs text-slate-500">投稿ID: {post.originalPostId}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <h2 className="text-lg font-semibold text-slate-800 mb-3">求めるカード</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {post.wantedCards.map((card) => (
                  <div
                    key={card.id}
                    className={`border rounded-md p-2 ${card.isPrimary ? "bg-purple-50 border-purple-200" : "bg-white"}`}
                  >
                    <Image
                      src={card.imageUrl || "/placeholder.svg"}
                      alt={card.name}
                      width={100}
                      height={140}
                      className="rounded object-contain aspect-[5/7] mx-auto"
                    />
                    <p className="text-xs text-center mt-1 truncate">{card.name}</p>
                    {card.isPrimary && <p className="text-xs text-center text-purple-600 font-medium">メインカード</p>}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-slate-800 mb-3">譲れるカード</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {post.offeredCards.map((card) => (
                  <div key={card.id} className="border rounded-md p-2 bg-white">
                    <Image
                      src={card.imageUrl || "/placeholder.svg"}
                      alt={card.name}
                      width={100}
                      height={140}
                      className="rounded object-contain aspect-[5/7] mx-auto"
                    />
                    <p className="text-xs text-center mt-1 truncate">{card.name}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {post.description && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-slate-800 mb-2">コメント</h2>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{post.description}</p>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="mb-8">
            <h2 className="text-lg font-semibold text-slate-800 mb-3">コメント ({post.comments.length})</h2>
            {post.comments.length > 0 ? (
              <ScrollArea className="h-[300px] rounded-md border">
                <div className="p-4 space-y-4">
                  {post.comments.map((comment) => (
                    <div key={comment.id} className="flex space-x-3">
                      {comment.avatar ? (
                        <Image
                          src={comment.avatar || "/placeholder.svg"}
                          alt={comment.author}
                          width={32}
                          height={32}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-purple-200 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-medium text-purple-700">
                            {comment.author.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-baseline">
                          <span className="font-medium text-sm">{comment.author}</span>
                          <span className="text-xs text-slate-500 ml-2">{comment.timestamp}</span>
                        </div>
                        <p className="text-sm text-slate-700 mt-1 whitespace-pre-wrap">{comment.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <p className="text-sm text-slate-500 italic">コメントはまだありません。</p>
            )}
          </div>

          <form onSubmit={handleCommentSubmit} className="space-y-3">
            <Textarea
              placeholder={isAuthenticated ? "コメントを入力してください..." : "コメントするにはログインが必要です。"}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              disabled={!isAuthenticated || submittingComment}
              rows={3}
              className="resize-none"
            />
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={!isAuthenticated || !comment.trim() || submittingComment}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {submittingComment ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    送信中...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    コメントする
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  )
}
