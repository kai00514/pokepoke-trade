"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, UserCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { createBrowserClient } from "@/lib/supabase/client"
import LoginPromptModal from "@/components/ui/login-prompt-modal"

// Define types for comments
interface Comment {
  id: string
  author: string
  avatar?: string | null
  text: string
  timestamp: string
  isGuest?: boolean
}

interface DeckCommentsProps {
  deckId: string
  deckTitle: string
  commentType?: "deck" | "deck_page" // オプショナルに変更
}

export default function DeckComments({ deckId, deckTitle, commentType = "deck" }: DeckCommentsProps) {
  const { user, loading } = useAuth()
  const { toast } = useToast()
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)

  const supabase = createBrowserClient()

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      console.log("🔐 [DeckComments] Starting auth check...")
      console.log("🔐 [DeckComments] useAuth hook values:", { user, loading })

      try {
        const { data, error } = await supabase.auth.getSession()
        console.log("🔐 [DeckComments] Supabase session check:", {
          hasSession: !!data.session,
          hasUser: !!data.session?.user,
          userId: data.session?.user?.id,
          userEmail: data.session?.user?.email,
          displayName: data.session?.user?.user_metadata?.display_name,
          error: error,
        })

        const authenticated = !!data.session?.user
        setIsAuthenticated(authenticated)

        console.log("🔐 [DeckComments] Final auth status:", {
          isAuthenticated: authenticated,
          useAuthUser: !!user,
          useAuthLoading: loading,
        })
      } catch (error) {
        console.error("❌ [DeckComments] Auth check error:", error)
        setIsAuthenticated(false)
      }
    }

    // 初回チェック
    checkAuth()

    // 認証状態変更の監視
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("🔐 [DeckComments] Auth state changed:", {
        event,
        hasSession: !!session,
        hasUser: !!session?.user,
        userId: session?.user?.id,
      })

      const authenticated = !!session?.user
      setIsAuthenticated(authenticated)
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [supabase.auth, user, loading])

  const fetchComments = useCallback(async () => {
    if (!deckId) return
    console.log("📥 [DeckComments] Fetching comments for deckId:", deckId, "commentType:", commentType)
    setIsLoading(true)
    try {
      const response = await fetch(`/api/deck-comments?deckId=${deckId}&commentType=${commentType}`)
      const data = await response.json()

      console.log("📥 [DeckComments] Fetch response:", {
        success: data.success,
        commentsCount: data.comments?.length || 0,
        error: data.error,
      })

      if (data.success) {
        // Transform the data to match the Comment interface
        const transformedComments = data.comments.map((comment: any) => ({
          id: comment.id,
          author: comment.user_name || "匿名ユーザー",
          avatar: null,
          text: comment.content,
          timestamp: new Date(comment.created_at).toLocaleString("ja-JP"),
          isGuest: !comment.user_id, // user_idがnullの場合はゲスト
        }))
        console.log("📥 [DeckComments] Transformed comments:", transformedComments.length)
        setComments(transformedComments)
      } else {
        console.error("❌ [DeckComments] Failed to fetch comments:", data.error)
        toast({
          title: "エラー",
          description: data.error || "コメントの読み込みに失敗しました。",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("❌ [DeckComments] Error fetching comments:", error)
      toast({
        title: "エラー",
        description: "予期しないエラーが発生しました。",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [deckId, commentType, toast])

  useEffect(() => {
    fetchComments()
  }, [fetchComments])

  const handleCommentSubmit = useCallback(
    async (isGuestSubmission = false) => {
      console.log("📤 [DeckComments] Starting comment submission")
      console.log("📤 [DeckComments] isGuestSubmission:", isGuestSubmission)

      if (!newComment.trim()) {
        console.log("❌ [DeckComments] Empty comment")
        toast({
          title: "入力エラー",
          description: "コメントを入力してください。",
          variant: "destructive",
        })
        return
      }

      const commentText = newComment.trim()

      // 認証状態を確認
      const { data: sessionData } = await supabase.auth.getSession()
      const currentUser = sessionData.session?.user
      const isActualGuestUser = !currentUser || isGuestSubmission

      console.log("📤 [DeckComments] User info for submission:", {
        hasCurrentUser: !!currentUser,
        currentUserId: currentUser?.id,
        userIdType: typeof currentUser?.id,
        userIdLength: currentUser?.id?.length,
        isActualGuestUser,
        userEmail: currentUser?.email,
        displayName: currentUser?.user_metadata?.display_name,
        fullName: currentUser?.user_metadata?.full_name,
        userName: currentUser?.user_metadata?.user_name,
        commentType,
        isGuestSubmission,
        // UUID形式かどうかの確認
        isValidUUID: currentUser?.id
          ? /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(currentUser.id)
          : false,
      })

      // user_nameの決定 - より多くのフィールドをチェック
      let userName = "ゲスト"
      if (!isActualGuestUser && currentUser) {
        userName =
          currentUser.user_metadata?.display_name ||
          currentUser.user_metadata?.full_name ||
          currentUser.user_metadata?.user_name ||
          currentUser.email?.split("@")[0] ||
          "匿名ユーザー"
      }

      console.log("📤 [DeckComments] Determined userName:", userName)

      // 楽観的UI更新 - 即座にコメントを表示
      const optimisticComment: Comment = {
        id: `temp-${Date.now()}`,
        author: userName,
        avatar: null,
        text: commentText,
        timestamp: "たった今",
        isGuest: isActualGuestUser,
      }

      // 即座にコメントを画面に追加
      setComments((prev) => [...prev, optimisticComment])

      // 入力フィールドをクリア
      setNewComment("")

      try {
        // バックグラウンドでサーバーに送信
        const payload = {
          deckId: deckId,
          content: commentText,
          userId: isActualGuestUser ? null : currentUser?.id,
          userName: userName,
          isGuest: isActualGuestUser,
          commentType: commentType || "deck",
        }

        console.log("📤 [DeckComments] Sending payload:", {
          deckId: payload.deckId,
          contentLength: payload.content.length,
          userId: payload.userId,
          userName: payload.userName,
          isGuest: payload.isGuest,
          commentType: payload.commentType,
        })

        const response = await fetch("/api/deck-comments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })

        console.log("📤 [DeckComments] Response status:", response.status)

        if (!response.ok) {
          const errorText = await response.text()
          console.error("❌ [DeckComments] HTTP error:", response.status, errorText)
          throw new Error(`HTTP ${response.status}: ${errorText}`)
        }

        const data = await response.json()
        console.log("📤 [DeckComments] Response data:", {
          success: data.success,
          commentId: data.comment?.id,
          error: data.error,
        })

        if (data.success) {
          console.log("✅ [DeckComments] Comment submitted successfully")

          const actualComment: Comment = {
            id: data.comment.id,
            author: data.comment.user_name || userName,
            avatar: null,
            text: data.comment.content,
            timestamp: new Date(data.comment.created_at).toLocaleString("ja-JP"),
            isGuest: !data.comment.user_id,
          }

          // 楽観的コメントを実際のコメントで置き換え
          setComments((prev) => prev.map((comment) => (comment.id === optimisticComment.id ? actualComment : comment)))

          toast({
            title: "投稿完了",
            description: isActualGuestUser ? "ゲストとしてコメントを投稿しました" : "コメントを投稿しました",
            duration: 2000,
          })
        } else {
          throw new Error(data.error || "コメントの投稿に失敗しました")
        }
      } catch (error) {
        // エラー時は楽観的に追加したコメントを削除
        console.error("❌ [DeckComments] Error submitting comment:", error)
        setComments((prev) => prev.filter((comment) => comment.id !== optimisticComment.id))

        // 入力内容を復元
        setNewComment(commentText)

        toast({
          title: "コメント投稿エラー",
          description:
            error instanceof Error ? error.message : "コメントの投稿に失敗しました。もう一度お試しください。",
          variant: "destructive",
        })
      }
    },
    [newComment, deckId, commentType, toast, supabase.auth],
  )

  const handleCommentSubmitClick = useCallback(async () => {
    console.log("🖱️ [DeckComments] Submit button clicked")

    if (!newComment.trim()) {
      toast({
        title: "入力エラー",
        description: "コメントを入力してください。",
        variant: "destructive",
      })
      return
    }

    // リアルタイムで認証状態を再確認
    const { data: sessionData } = await supabase.auth.getSession()
    const hasValidSession = !!sessionData.session?.user

    console.log("🖱️ [DeckComments] Real-time auth check:", {
      hasValidSession,
      sessionUserId: sessionData.session?.user?.id,
      isAuthenticated,
    })

    if (!hasValidSession) {
      console.log("🖱️ [DeckComments] Not authenticated, showing login prompt")
      setShowLoginPrompt(true)
    } else {
      console.log("🖱️ [DeckComments] Authenticated, proceeding with submission")
      handleCommentSubmit(false) // 認証済みユーザーとして送信
    }
  }, [newComment, isAuthenticated, handleCommentSubmit, toast, supabase.auth])

  const handleContinueAsGuest = useCallback(() => {
    console.log("🖱️ [DeckComments] 'Continue as Guest' clicked")
    setShowLoginPrompt(false) // モーダルを閉じる
    handleCommentSubmit(true) // ゲストとしてコメントを送信
  }, [handleCommentSubmit, setShowLoginPrompt])

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-xl">
        <div className="bg-purple-600 text-white p-4 rounded-t-lg">
          <h2 className="text-xl font-semibold">コメント</h2>
        </div>
        <div className="p-4 sm:p-6 flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-xl">
      <div className="bg-purple-600 text-white p-4 rounded-t-lg">
        <h2 className="text-xl font-semibold">コメント ({comments.length})</h2>
      </div>

      <div className="p-4 sm:p-6 space-y-4">
        {comments.length > 0 ? (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="flex items-start space-x-3 pb-4 border-b border-slate-100 last:border-b-0 last:pb-0"
            >
              <UserCircle className="h-9 w-9 text-slate-400 flex-shrink-0" />
              <div className="flex-grow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-semibold text-slate-700">{comment.author}</span>
                    {comment.isGuest && (
                      <span className="px-2 py-0.5 text-xs bg-gray-200 text-gray-600 rounded-full">ゲスト</span>
                    )}
                  </div>
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

      <div className="p-4 sm:p-6 border-t border-slate-200 bg-slate-50 rounded-b-lg">
        {/* ユーザー状態の表示 */}
        <div className="mb-3 text-sm text-gray-600">
          {isAuthenticated ? <span>ログイン中: {user?.user_metadata?.display_name || user?.email}</span> : null}
        </div>
        <div className="flex items-center space-x-2">
          <Input
            type="text"
            placeholder={
              isAuthenticated ? "コメントを入力してください..." : "ゲストとしてコメントを入力してください..."
            }
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="flex-grow bg-white"
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
            disabled={!newComment.trim()}
          >
            <Send className="h-4 w-4 mr-0 sm:mr-2" />
            <span className="hidden sm:inline">投稿</span>
          </Button>
        </div>
        {/* デバッグ情報表示（開発時のみ） */}
        {process.env.NODE_ENV === "development" && (
          <div className="mt-2 text-xs text-gray-500 space-y-1">
            <div>認証状態: {isAuthenticated ? "ログイン済み" : "ゲスト"}</div>
            <div>useAuth user: {user ? "あり" : "なし"}</div>
            <div>useAuth loading: {loading ? "読み込み中" : "完了"}</div>
            <div>コメントタイプ: {commentType}</div>
          </div>
        )}
      </div>
      {/* Login Prompt Modal */}
      {showLoginPrompt && (
        <LoginPromptModal onClose={() => setShowLoginPrompt(false)} onContinueAsGuest={handleContinueAsGuest} />
      )}
    </div>
  )
}
