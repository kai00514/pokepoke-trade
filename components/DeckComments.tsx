"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { MessageCircle, Send, User, Clock, Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase/client"

interface Comment {
  id: string
  post_id: string
  user_id: string
  user_name: string | null
  content: string
  created_at: string
  is_guest: boolean
  is_deleted: boolean
  is_edited: boolean
}

interface DeckCommentsProps {
  deckId: string
  deckTitle: string
}

export default function DeckComments({ deckId, deckTitle }: DeckCommentsProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  // コメントを取得
  const fetchComments = async () => {
    try {
      setError(null)
      const response = await fetch(`/api/deck-comments?deckId=${deckId}`)
      const data = await response.json()

      if (data.success) {
        setComments(data.comments || [])
      } else {
        setError(data.error || "コメントの取得に失敗しました")
      }
    } catch (err) {
      console.error("Error fetching comments:", err)
      setError("コメントの取得中にエラーが発生しました")
    } finally {
      setIsLoading(false)
    }
  }

  // コメントを投稿
  const handleSubmitComment = async () => {
    if (!newComment.trim()) {
      toast({ title: "エラー", description: "コメントを入力してください", variant: "destructive" })
      return
    }

    const commentContent = newComment.trim()
    const tempId = `temp-${Date.now()}`

    // 楽観的UI更新 - 即座にコメントを画面に追加
    const optimisticComment = {
      id: tempId,
      post_id: deckId,
      user_id: user?.id || null,
      user_name: user?.user_metadata?.display_name || user?.email || "ゲスト",
      content: commentContent,
      created_at: new Date().toISOString(),
      is_guest: !user,
      is_deleted: false,
      is_edited: false,
    }

    // 即座にコメントを表示
    setComments((prev) => [...prev, optimisticComment])
    setNewComment("")

    // スクロールを最下部に移動
    setTimeout(() => {
      if (scrollAreaRef.current) {
        const scrollContainer = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]")
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollContainer.scrollHeight
        }
      }
    }, 50)

    try {
      // バックグラウンドでサーバーに送信
      const payload = {
        postId: deckId,
        content: commentContent,
        userId: user?.id,
        userName: user?.user_metadata?.display_name || user?.email || "ゲスト",
        isGuest: !user,
      }

      const response = await fetch("/api/trade-comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (data.success && data.comment) {
        // サーバーからの正式なコメントで置き換え
        setComments((prev) => prev.map((comment) => (comment.id === tempId ? data.comment : comment)))

        // 成功のフィードバック（控えめに）
        toast({
          title: "投稿完了",
          description: "コメントを投稿しました",
          duration: 2000,
        })
      } else {
        throw new Error(data.error || "コメントの投稿に失敗しました")
      }
    } catch (error) {
      // エラー時は楽観的に追加したコメントを削除
      setComments((prev) => prev.filter((comment) => comment.id !== tempId))

      // 入力内容を復元
      setNewComment(commentContent)

      console.error("Error submitting comment:", error)
      toast({
        title: "エラー",
        description: "コメントの投稿に失敗しました。もう一度お試しください。",
        variant: "destructive",
      })
    }
  }

  // リアルタイム更新の設定
  useEffect(() => {
    fetchComments()

    // Supabaseリアルタイム購読
    const channel = supabase
      .channel(`deck-comments-${deckId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "trade_comments",
          filter: `post_id=eq.${deckId}`,
        },
        (payload) => {
          console.log("Real-time update:", payload)
          // コメントが追加・更新・削除された場合に再取得
          fetchComments()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [deckId])

  // エンターキーでの投稿
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmitComment()
    }
  }

  // 時間フォーマット
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return "たった今"
    if (diffInMinutes < 60) return `${diffInMinutes}分前`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}時間前`
    return date.toLocaleDateString("ja-JP", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageCircle className="h-5 w-5" />
          コメント ({comments.length})
        </CardTitle>
        <p className="text-sm text-gray-600">「{deckTitle}」について話し合いましょう</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* コメント表示エリア */}
        <div className="border rounded-lg">
          <ScrollArea ref={scrollAreaRef} className="h-80 p-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">コメントを読み込み中...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-red-500">
                  <p>{error}</p>
                  <Button variant="outline" size="sm" onClick={fetchComments} className="mt-2">
                    再試行
                  </Button>
                </div>
              </div>
            ) : comments.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-gray-500">
                  <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>まだコメントがありません</p>
                  <p className="text-sm">最初のコメントを投稿してみましょう！</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {comments
                  .filter((comment) => !comment.is_deleted)
                  .map((comment) => (
                    <div
                      key={comment.id}
                      className="flex gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-white" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm text-gray-900">
                            {comment.user_name || (comment.is_guest ? "ゲスト" : "匿名ユーザー")}
                          </span>
                          {comment.is_guest && (
                            <span className="px-2 py-0.5 text-xs bg-gray-200 text-gray-600 rounded-full">ゲスト</span>
                          )}
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="h-3 w-3" />
                            {formatTime(comment.created_at)}
                          </div>
                          {comment.is_edited && <span className="text-xs text-yellow-600">編集済み</span>}
                        </div>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">{comment.content}</p>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* コメント投稿エリア */}
        <div className="space-y-3">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={user ? "コメントを入力してください..." : "ゲストとしてコメントを投稿できます"}
            className="min-h-[80px] resize-none"
          />
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500">
              {user ? (
                <span>{user.user_metadata?.display_name || user.email || "匿名ユーザー"} としてコメント</span>
              ) : (
                <span>ゲストとしてコメント（ログインすると名前が表示されます）</span>
              )}
            </div>
            <Button
              onClick={handleSubmitComment}
              disabled={!newComment.trim()}
              size="sm"
              className="flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              投稿
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
