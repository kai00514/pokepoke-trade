"use client"
import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import AuthHeader from "@/components/auth-header"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Copy, Send, UserCircle, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import type { Card as CardInfo } from "@/components/detailed-search-modal"
import { getTradePostDetailsById, addCommentToTradePost } from "@/lib/actions/trade-actions"
import { createBrowserClient } from "@/lib/supabase/client"
import LoginPromptModal from "@/components/ui/login-prompt-modal"

// Define types for post details and comments
interface Comment {
  id: string
  author: string
  avatar?: string | null
  text: string
  timestamp: string
}

interface Author {
  username: string
  avatarUrl: string | null
}

interface TradePostDetails {
  id: string
  title: string
  status: string
  wantedCards: CardInfo[]
  offeredCards: CardInfo[]
  description: string
  authorNotes?: string
  originalPostId: string
  comments: Comment[]
  author: Author
  createdAt: string
}

export default function TradeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [post, setPost] = useState<TradePostDetails | null>(null)
  const [newComment, setNewComment] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [guestName, setGuestName] = useState("")

  const supabase = createBrowserClient()
  const postId = params.id as string

  const handleCopyToClipboard = useCallback(() => {
    if (post?.originalPostId) {
      navigator.clipboard.writeText(post.originalPostId)
      toast({
        title: "コピーしました",
        description: `ID: ${post.originalPostId} をクリップボードにコピーしました。`,
      })
    }
  }, [post?.originalPostId, toast])

  // Check authentication status
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

  // Redirect if trying to access create page through dynamic route
  useEffect(() => {
    if (postId === "create") {
      router.replace("/trades/create")
      return
    }
  }, [postId, router])

  const fetchPostDetails = useCallback(async () => {
    if (!postId || postId === "create") return
    setIsLoading(true)
    try {
      const result = await getTradePostDetailsById(postId)
      if (result.success && result.post) {
        setPost(result.post as TradePostDetails)
      } else {
        setPost(null)
        toast({
          title: "エラー",
          description: result.error || "投稿の読み込みに失敗しました。",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error(error)
      toast({
        title: "エラー",
        description: "予期しないエラーが発生しました。",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [postId, toast])

  // Don't render anything if this is the create route
  if (postId === "create") {
    return null
  }

  useEffect(() => {
    fetchPostDetails()
  }, [fetchPostDetails])

  const handleCommentSubmitClick = () => {
    if (!newComment.trim()) {
      toast({
        title: "入力エラー",
        description: "コメントを入力してください。",
        variant: "destructive",
      })
      return
    }

    if (!isAuthenticated) {
      setShowLoginPrompt(true)
    } else {
      handleCommentSubmit()
    }
  }

  const handleContinueAsGuest = () => {
    setShowLoginPrompt(false)
    handleCommentSubmit()
  }

  const handleCommentSubmit = async () => {
    if (!newComment.trim() || !postId) return

    setIsSubmittingComment(true)
    try {
      const result = await addCommentToTradePost(
        postId,
        newComment.trim(),
        !isAuthenticated ? guestName.trim() : undefined,
      )
      if (result.success) {
        setNewComment("")
        setGuestName("")
        toast({
          title: "コメントを投稿しました",
        })
        // Re-fetch post details to show the new comment
        await fetchPostDetails()
      } else {
        toast({
          title: "コメント投稿エラー",
          description: result.error || "コメントの投稿に失敗しました。",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error(error)
      toast({
        title: "エラー",
        description: "予期しないエラーが発生しました。",
        variant: "destructive",
      })
    } finally {
      setIsSubmittingComment(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <AuthHeader />
        <main className="flex-grow container mx-auto px-4 py-8 flex justify-center items-center">
          <Loader2 className="h-10 w-10 animate-spin text-purple-600" />
        </main>
        <Footer />
      </div>
    )
  }

  if (!post) {
    return (
      <div className="flex flex-col min-h-screen">
        <AuthHeader />
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
      <h2 className="text-lg font-semibold text-slate-700 mb-3">{title}</h2>
      {cards.length > 0 ? (
        <div className="flex flex-wrap gap-3">
          {cards.map((card) => (
            <div key={card.id} className="flex flex-col items-center">
              <Image
                src={card.imageUrl || "/placeholder.svg?width=80&height=112"}
                alt={card.name}
                width={80}
                height={112}
                className="rounded-md object-contain border border-slate-200 bg-slate-50 shadow-sm"
              />
              <p className="text-xs font-medium text-slate-600 mt-1 text-center max-w-[80px] truncate">{card.name}</p>
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
      <AuthHeader />
      <main className="flex-grow container mx-auto px-4 py-8">
        <Link href="/" className="inline-flex items-center text-sm text-purple-600 hover:text-purple-700 mb-6 group">
          <ArrowLeft className="h-4 w-4 mr-1 transition-transform group-hover:-translate-x-1" />
          タイムラインに戻る
        </Link>

        <div className="bg-white p-6 sm:p-8 rounded-lg shadow-xl mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">{post.title}</h1>
              <div className="flex items-center mt-2 text-sm text-slate-500">
                {post.author.avatarUrl ? (
                  <Image
                    src={post.author.avatarUrl || "/placeholder.svg"}
                    alt={post.author.username}
                    width={24}
                    height={24}
                    className="rounded-full mr-2"
                  />
                ) : (
                  <UserCircle className="h-6 w-6 text-slate-400 mr-2" />
                )}
                <span>{post.author.username}</span>
                <span className="mx-2">•</span>
                <span>{post.createdAt}</span>
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

          <div className="space-y-6 mb-6">
            {renderCardList(post.wantedCards, "求めるカード")}
            {renderCardList(post.offeredCards, "譲りたいカード")}
          </div>

          {post.authorNotes && (
            <div className="bg-slate-100 p-4 rounded-md mb-6">
              <h3 className="font-semibold text-slate-800 mb-2">投稿者からのコメント</h3>
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

          <div className="p-4 sm:p-6 border-t border-slate-200 bg-slate-50 rounded-b-lg space-y-4">
            {!isAuthenticated && (
              <div>
                <label htmlFor="guestName" className="block text-sm font-medium text-slate-700 mb-1">
                  ゲスト名
                </label>
                <Input
                  id="guestName"
                  type="text"
                  placeholder="表示名を入力してください"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="bg-white"
                  disabled={isSubmittingComment}
                />
              </div>
            )}
            <div className="flex items-center space-x-2">
              <Input
                type="text"
                placeholder="コメントを入力してください..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-grow bg-white"
                disabled={isSubmittingComment}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleCommentSubmitClick()
                  }
                }}
              />
              <Button
                type="button"
                onClick={handleCommentSubmitClick}
                className="bg-purple-600 hover:bg-purple-700 text-white"
                disabled={!newComment.trim() || isSubmittingComment || (!isAuthenticated && !guestName.trim())}
              >
                {isSubmittingComment ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-0 sm:mr-2" />
                    <span className="hidden sm:inline">投稿</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />

      {/* Login Prompt Modal */}
      {showLoginPrompt && (
        <LoginPromptModal onClose={() => setShowLoginPrompt(false)} onContinueAsGuest={handleContinueAsGuest} />
      )}
    </div>
  )
}
