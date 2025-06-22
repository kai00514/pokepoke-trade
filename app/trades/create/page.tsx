"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import Header from "@/components/layout/header"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { InfoIcon, ArrowLeft, Trash2, Loader2, Clock, AlertTriangle } from "lucide-react"
import DetailedSearchModal from "@/components/detailed-search-modal"
import type { Card as SelectedCardType } from "@/components/detailed-search-modal"
import { useToast } from "@/components/ui/use-toast"
import { createTradePost } from "@/lib/actions/trade-actions"
import { createBrowserClient } from "@/lib/supabase/client"
import LoginPromptModal from "@/components/ui/login-prompt-modal"
import AuthDebug from "@/components/auth-debug"
import { checkTimeSync, formatTimeSkew, type TimeSync } from "@/lib/utils/time-sync"

type SelectionContextType = "wanted" | "offered" | null

export default function CreateTradePage() {
  const [tradeTitle, setTradeTitle] = useState("")
  const [wantedCards, setWantedCards] = useState<SelectedCardType[]>([])
  const [offeredCards, setOfferedCards] = useState<SelectedCardType[]>([])
  const [appId, setAppId] = useState("")
  const [comment, setComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({})
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [timeSync, setTimeSync] = useState<TimeSync | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalSelectionContext, setModalSelectionContext] = useState<SelectionContextType>(null)
  const [modalMaxSelection, setModalMaxSelection] = useState<number | undefined>(undefined)
  const [currentModalTitle, setCurrentModalTitle] = useState("カードを選択")
  const [modalInitialCards, setModalInitialCards] = useState<SelectedCardType[]>([])

  const { toast } = useToast()
  const router = useRouter()
  const supabase = createBrowserClient()

  // Check time sync on component mount
  useEffect(() => {
    const checkTime = async () => {
      const syncResult = await checkTimeSync()
      setTimeSync(syncResult)

      if (syncResult.isSkewed) {
        console.warn("⏰ Time sync issue detected:", {
          deviceTime: new Date(syncResult.deviceTime).toISOString(),
          serverTime: new Date(syncResult.serverTime).toISOString(),
          skew: formatTimeSkew(syncResult.skew),
        })
      }
    }

    checkTime()
  }, [])

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession()
      const isAuth = !!data.session
      const userId = data.session?.user?.id || null

      setIsAuthenticated(isAuth)
      setCurrentUserId(userId)

      console.log("[CreateTradePage] Auth status:", {
        hasSession: !!data.session,
        hasUser: !!data.session?.user,
        userId: userId,
        isAuthenticated: isAuth,
        sessionExpiry: data.session?.expires_at ? new Date(data.session.expires_at * 1000).toISOString() : null,
        currentTime: new Date().toISOString(),
      })

      // セッションの有効期限をチェック
      if (data.session?.expires_at) {
        const expiryTime = data.session.expires_at * 1000
        const currentTime = Date.now()
        const timeToExpiry = expiryTime - currentTime

        console.log("[CreateTradePage] Session expiry check:", {
          expiryTime: new Date(expiryTime).toISOString(),
          currentTime: new Date(currentTime).toISOString(),
          timeToExpiry: Math.floor(timeToExpiry / 1000) + " seconds",
          isExpired: timeToExpiry <= 0,
        })

        if (timeToExpiry <= 0) {
          console.warn("[CreateTradePage] ⚠️ Session appears to be expired")
          toast({
            title: "セッション期限切れ",
            description: "セッションの有効期限が切れています。再ログインしてください。",
            variant: "destructive",
          })
        }
      }
    }

    checkAuth()

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      const isAuth = !!session
      const userId = session?.user?.id || null

      setIsAuthenticated(isAuth)
      setCurrentUserId(userId)
      console.log("ユーザーID: ", userId)

      console.log("[CreateTradePage] Auth state changed:", {
        event,
        hasSession: !!session,
        hasUser: !!session?.user,
        userId: userId,
        isAuthenticated: isAuth,
        sessionExpiry: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : null,
      })
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [supabase.auth, toast])

  const validateForm = () => {
    const errors: { [key: string]: string } = {}

    if (!tradeTitle.trim()) {
      errors.title = "トレード目的を入力してください。"
    }

    if (wantedCards.length === 0) {
      errors.wantedCards = "求めるカードを選択してください。"
    }

    if (offeredCards.length === 0) {
      errors.offeredCards = "譲れるカードを選択してください。"
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const openModal = (context: SelectionContextType, maxSelection: number | undefined, title: string) => {
    // 現在の選択状態を取得
    const currentCards = context === "wanted" ? wantedCards : offeredCards

    // モーダルの状態を設定
    setModalSelectionContext(context)
    setModalMaxSelection(maxSelection)
    setCurrentModalTitle(title)
    setModalInitialCards([...currentCards]) // 配列をコピーして設定

    // モーダルを開く
    setIsModalOpen(true)
  }

  const handleModalSelectionComplete = (selected: SelectedCardType[]) => {
    console.log("Modal selection complete:", {
      context: modalSelectionContext,
      selectedCount: selected.length,
      selected: selected.map((c) => ({ id: c.id, name: c.name })),
    })

    if (modalSelectionContext === "wanted") {
      setWantedCards([...selected]) // 配列をコピーして設定
      if (formErrors.wantedCards) {
        setFormErrors((prev) => ({ ...prev, wantedCards: "" }))
      }
    } else if (modalSelectionContext === "offered") {
      setOfferedCards([...selected]) // 配列をコピーして設定
      if (formErrors.offeredCards) {
        setFormErrors((prev) => ({ ...prev, offeredCards: "" }))
      }
    }

    // モーダルを閉じる
    setIsModalOpen(false)
    setModalSelectionContext(null)
    setModalInitialCards([])
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setModalSelectionContext(null)
    setModalInitialCards([])
  }

  const removeCard = (cardId: string, context: "wanted" | "offered") => {
    if (context === "wanted") {
      setWantedCards((prev) => prev.filter((card) => card.id !== cardId))
    } else {
      setOfferedCards((prev) => prev.filter((card) => card.id !== cardId))
    }
  }

  const handleRefreshSession = async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession()
      if (error) {
        console.error("Failed to refresh session:", error)
        toast({
          title: "セッション更新エラー",
          description: "セッションの更新に失敗しました。再ログインしてください。",
          variant: "destructive",
        })
      } else {
        console.log("Session refreshed successfully:", data)
        toast({
          title: "セッション更新完了",
          description: "セッションが正常に更新されました。",
        })
      }
    } catch (error) {
      console.error("Error refreshing session:", error)
    }
  }

  const handleSubmitClick = () => {
    if (!validateForm()) {
      toast({
        title: "入力エラー",
        description: "必須項目を入力してください。",
        variant: "destructive",
      })
      return
    }

    // 時刻同期の問題がある場合は警告
    if (timeSync?.isSkewed) {
      toast({
        title: "時刻同期の問題",
        description: `デバイスの時計が${formatTimeSkew(timeSync.skew)}ずれています。投稿に失敗する可能性があります。`,
        variant: "destructive",
      })
    }

    if (!isAuthenticated) {
      setShowLoginPrompt(true)
    } else {
      handleSubmit()
    }
  }

  const handleContinueAsGuest = () => {
    setShowLoginPrompt(false)
    handleSubmit()
  }

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true)

      console.log("[CreateTradePage] Submitting trade post:", {
        isAuthenticated,
        currentUserId: currentUserId,
        title: tradeTitle,
        wantedCardsCount: wantedCards.length,
        offeredCardsCount: offeredCards.length,
        timeSync: timeSync
          ? {
              skew: formatTimeSkew(timeSync.skew),
              isSkewed: timeSync.isSkewed,
            }
          : null,
      })
      console.log("ユーザーID2: ", currentUserId)
      const result = await createTradePost({
        title: tradeTitle,
        wantedCards,
        offeredCards,
        appId: appId.trim() || undefined,
        comment: comment.trim() || undefined,
        userId: isAuthenticated ? currentUserId : undefined,
      })

      console.log("[CreateTradePage] Trade post result:", result)

      if (result.success) {
        toast({
          title: "投稿成功",
          description: "トレード投稿が作成されました。",
        })

        // Redirect to the newly created post or the timeline
        if (result.postId) {
          router.push(`/trades/${result.postId}`)
        } else {
          router.push("/")
        }
      } else {
        toast({
          title: "投稿エラー",
          description: result.error || "投稿の作成に失敗しました。",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error submitting trade post:", error)
      toast({
        title: "エラー",
        description: "予期しないエラーが発生しました。",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderSelectedCards = (cards: SelectedCardType[], context: "wanted" | "offered") => {
    if (cards.length === 0) {
      return (
        <div>
          <p className="text-sm text-slate-500 mt-2">カードが選択されていません</p>
          {formErrors[context === "wanted" ? "wantedCards" : "offeredCards"] && (
            <p className="text-sm text-red-500 mt-1">
              {formErrors[context === "wanted" ? "wantedCards" : "offeredCards"]}
            </p>
          )}
        </div>
      )
    }
    return (
      <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
        {cards.map((card) => (
          <div key={card.id} className="relative group border rounded-md p-1 bg-slate-50">
            <Image
              src={card.imageUrl || "/placeholder.svg"}
              alt={card.name}
              width={80}
              height={112}
              className="rounded object-contain aspect-[5/7] mx-auto"
            />
            <p className="text-xs text-center mt-1 truncate">{card.name}</p>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-0 right-0 h-6 w-6 bg-red-500 text-white opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-opacity"
              onClick={() => removeCard(card.id, context)}
              aria-label={`Remove ${card.name}`}
              disabled={isSubmitting}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>
    )
  }

  // Show loading state while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-100">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8 flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-purple-600" />
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-100">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <Link href="/" className="inline-flex items-center text-sm text-purple-600 hover:text-purple-700 mb-6">
          <ArrowLeft className="h-4 w-4 mr-1" />
          タイムラインに戻る
        </Link>

        <div className="bg-white p-6 sm:p-8 rounded-lg shadow-md max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-slate-800 mb-6 text-center">トレードカードを登録</h1>

          {/* 時刻同期の警告 */}
          {timeSync?.isSkewed && (
            <Alert className="mb-6 bg-yellow-50 border-yellow-200">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <AlertTitle className="text-yellow-700 font-semibold">時刻同期の問題</AlertTitle>
              <AlertDescription className="text-yellow-600 text-sm">
                デバイスの時計が{formatTimeSkew(timeSync.skew)}ずれています。
                これにより認証に問題が発生する可能性があります。
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefreshSession}
                  className="ml-2 text-yellow-700 border-yellow-300 hover:bg-yellow-100"
                >
                  <Clock className="h-4 w-4 mr-1" />
                  セッション更新
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* デバッグ情報（開発時のみ表示） */}
          {process.env.NODE_ENV === "development" && (
            <div className="mb-6">
              <AuthDebug />
              {timeSync && (
                <div className="mt-4 p-3 bg-gray-50 rounded border text-xs">
                  <h4 className="font-semibold mb-2">時刻同期情報:</h4>
                  <div>デバイス時刻: {new Date(timeSync.deviceTime).toISOString()}</div>
                  <div>サーバー時刻: {new Date(timeSync.serverTime).toISOString()}</div>
                  <div>時差: {formatTimeSkew(timeSync.skew)}</div>
                  <div>同期状態: {timeSync.isSkewed ? "❌ ずれあり" : "✅ 正常"}</div>
                </div>
              )}
            </div>
          )}

          <Alert className="mb-6 bg-blue-50 border-blue-200">
            <InfoIcon className="h-5 w-5 text-blue-600" />
            <AlertTitle className="text-blue-700 font-semibold">お知らせ</AlertTitle>
            <AlertDescription className="text-blue-600 text-sm">
              ここで登録された内容はタイムラインに即時反映されます。コメントがあれば、ベルマークから確認できます。
              トレード状況はマイページのトレード履歴から確認できます。
            </AlertDescription>
          </Alert>

          <form className="space-y-6">
            <div>
              <label htmlFor="tradeTitle" className="block text-sm font-medium text-slate-700 mb-1">
                トレード目的 <span className="text-red-500">*</span>
              </label>
              <Input
                id="tradeTitle"
                value={tradeTitle}
                onChange={(e) => {
                  setTradeTitle(e.target.value)
                  if (formErrors.title) {
                    setFormErrors((prev) => ({ ...prev, title: "" }))
                  }
                }}
                placeholder="例：リザードンex求む"
                required
                disabled={isSubmitting}
                className={formErrors.title ? "border-red-500" : ""}
              />
              {formErrors.title && <p className="text-sm text-red-500 mt-1">{formErrors.title}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                求めるカード <span className="text-red-500">*</span>
              </label>
              <Button
                type="button"
                onClick={() => openModal("wanted", 1, "求めるカードを選択")}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                disabled={isSubmitting}
              >
                カードを選択 (最大1枚)
              </Button>
              {renderSelectedCards(wantedCards, "wanted")}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                譲れるカード <span className="text-red-500">*</span>
              </label>
              <Button
                type="button"
                onClick={() => openModal("offered", 15, "譲れるカードを選択")}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                disabled={isSubmitting}
              >
                カードを選択 (最大15枚)
              </Button>
              {renderSelectedCards(offeredCards, "offered")}
            </div>

            <div>
              <label htmlFor="appId" className="block text-sm font-medium text-slate-700 mb-1">
                ポケポケアプリID
              </label>
              <Input
                id="appId"
                value={appId}
                onChange={(e) => setAppId(e.target.value)}
                placeholder="ポケポケアプリのID (任意)"
                disabled={isSubmitting}
              />
              <p className="text-xs text-slate-500 mt-1">
                {isAuthenticated
                  ? "ログイン中です。ポケポケIDは任意です。"
                  : "ゲストユーザーとして投稿します。ポケポケIDは任意です。"}
              </p>
            </div>

            <div>
              <label htmlFor="comment" className="block text-sm font-medium text-slate-700 mb-1">
                コメント (任意)
              </label>
              <Textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="コメントを入力 (256文字まで)"
                rows={4}
                disabled={isSubmitting}
                maxLength={256}
              />
              <p className="text-xs text-right text-slate-500 mt-1">{comment.length}/256</p>
            </div>

            <div className="pt-4">
              <Button
                type="button"
                onClick={handleSubmitClick}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white text-base py-3"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    登録中...
                  </>
                ) : (
                  "登録する"
                )}
              </Button>
            </div>
          </form>
        </div>
      </main>
      <Footer />

      {/* DetailedSearchModal */}
      <DetailedSearchModal
        isOpen={isModalOpen}
        onOpenChange={handleModalClose}
        onSelectionComplete={handleModalSelectionComplete}
        maxSelection={modalMaxSelection}
        initialSelectedCards={modalInitialCards}
        modalTitle={currentModalTitle}
      />

      {/* Login Prompt Modal */}
      {showLoginPrompt && (
        <LoginPromptModal onClose={() => setShowLoginPrompt(false)} onContinueAsGuest={handleContinueAsGuest} />
      )}
    </div>
  )
}
