"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Heart, Star, MessageCircle, CalendarDays, Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { likeDeck, unlikeDeck, favoriteDeck, unfavoriteDeck } from "@/lib/services/deck-service"
import { useToast } from "@/components/ui/use-toast"
import LoginPromptModal from "@/components/ui/login-prompt-modal"
import type { Deck } from "@/types/deck" // 新しいDeckインターフェースをインポート

interface DeckCardProps {
  deck: Deck
  onCountUpdate?: (deckId: string, likeCount: number, favoriteCount: number) => void
}

export default function DeckCard({ deck, onCountUpdate }: DeckCardProps) {
  console.log("🔄 [DeckCard] component rendered for deck ID:", deck.id)
  console.log("🔄 [DeckCard] Received deck prop:", deck) // 受け取ったdeckプロップの全内容をログ出力

  const { user } = useAuth()
  const { toast } = useToast()

  // ローカル状態でいいね・お気に入りの状態とカウントを管理
  // Deckインターフェースのプロパティを直接使用
  const [isLiked, setIsLiked] = useState(false)
  const [isFavorited, setIsFavorited] = useState(false)
  const [likeCount, setLikeCount] = useState(deck.like_count || 0)
  const [favoriteCount, setFavoriteCount] = useState(deck.favorite_count || 0)
  const [isLikeLoading, setIsLikeLoading] = useState(false)
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [loginModalType, setLoginModalType] = useState<"like" | "favorite">("like")

  console.log("📊 [DeckCard] Initial state for deck ID:", deck.id, {
    user: user ? `${user.id} (${user.email})` : "not logged in",
    isLiked,
    isFavorited,
    likeCount,
    favoriteCount,
    isLikeLoading,
    isFavoriteLoading,
  })

  useEffect(() => {
    console.log(
      "🔧 [DeckCard] useEffect triggered - user changed for deck ID:",
      deck.id,
      user ? `${user.id} (${user.email})` : "not logged in",
    )

    if (user && deck.id) {
      const favoriteKey = `favorite_${user.id}_${deck.id}`
      const likeKey = `like_${user.id}_${deck.id}`

      const savedFavoriteState = localStorage.getItem(favoriteKey)
      const savedLikeState = localStorage.getItem(likeKey)

      if (savedFavoriteState !== null) {
        setIsFavorited(savedFavoriteState === "true")
        console.log(`🔧 [DeckCard] localStorage favorite state for ${deck.id}: ${savedFavoriteState}`)
      }
      if (savedLikeState !== null) {
        setIsLiked(savedLikeState === "true")
        console.log(`🔧 [DeckCard] localStorage like state for ${deck.id}: ${savedLikeState}`)
      }
    }
  }, [user, deck.id])

  // デッキ名を適切に取得 (titleがnullの場合も考慮)
  const deckName = deck.title || "無題のデッキ"
  // 更新日を適切に取得
  const updatedDate = deck.updated_at || deck.created_at || new Date().toISOString()

  // リンク先を決定（is_deck_pageプロパティを使用）
  const linkHref = deck.is_deck_page ? `/content/${deck.id}` : `/decks/${deck.id}`

  // ステータスバッジの表示内容を決定
  const getStatusBadge = () => {
    if (deck.source_tab === "お気に入り") {
      return { text: "お気に入り", variant: "outline" as const }
    }
    return null
  }

  const statusBadge = getStatusBadge()

  // サムネイル画像を取得（thumbnail_image_urlまたはthumbnail_imageを使用）
  const getThumbnailImage = () => {
    if (deck.thumbnail_image_url) {
      return {
        url: deck.thumbnail_image_url,
        name: deckName,
      }
    }

    if (deck.thumbnail_image) {
      return {
        url:
          deck.thumbnail_image.thumb_url || deck.thumbnail_image.image_url || "/placeholder.svg?width=120&height=168",
        name: deck.thumbnail_image.name,
      }
    }

    return { url: "/placeholder.svg?width=120&height=168", name: deckName }
  }

  const thumbnailImage = getThumbnailImage()
  console.log(`🎨 [DeckCard] Display values for deck ID ${deck.id}:`, {
    deckName,
    updatedDate,
    thumbnailImage,
    likeCount,
    favoriteCount,
    commentCount: deck.comment_count,
  })

  const handleLike = async (event: React.MouseEvent) => {
    console.log("❤️ [DeckCard] handleLike called - START for deck ID:", deck.id)
    event.preventDefault()
    event.stopPropagation()
    console.log("❤️ [DeckCard] Event prevented and stopped.")

    if (isLikeLoading) {
      console.log("❤️ [DeckCard] Already loading - returning.")
      return
    }

    setIsLikeLoading(true)
    const originalIsLiked = isLiked
    const originalLikeCount = likeCount
    console.log("❤️ [DeckCard] Current state before update:", { originalIsLiked, originalLikeCount })

    setIsLiked(!isLiked)
    const newLikeCount = originalIsLiked ? likeCount - 1 : likeCount + 1
    setLikeCount(newLikeCount)
    console.log("❤️ [DeckCard] UI updated immediately:", { newIsLiked: !isLiked, newLikeCount })

    try {
      const action = originalIsLiked ? unlikeDeck : likeDeck
      console.log("❤️ [DeckCard] Calling action:", originalIsLiked ? "unlikeDeck" : "likeDeck")
      const result = await action(deck.id)
      console.log("❤️ [DeckCard] Action result:", result)

      if (result.error) {
        console.error("❤️ [DeckCard] Action failed with error:", result.error)
        toast({ title: "エラー", description: result.error, variant: "destructive" })
        setIsLiked(originalIsLiked)
        setLikeCount(originalLikeCount)
        console.log("❤️ [DeckCard] Reverted UI state due to error.")
      } else {
        console.log("❤️ [DeckCard] Action successful.")
        if (onCountUpdate) {
          onCountUpdate(deck.id, newLikeCount, favoriteCount)
          console.log("❤️ [DeckCard] Called onCountUpdate callback.")
        }
        if (user) {
          const likeKey = `like_${user.id}_${deck.id}`
          localStorage.setItem(likeKey, (!originalIsLiked).toString())
          console.log(`❤️ [DeckCard] localStorage updated for like state: ${!originalIsLiked}`)
        }
      }
    } catch (actionError) {
      console.error("❤️ [DeckCard] Exception during action:", actionError)
      toast({ title: "エラー", description: "操作に失敗しました", variant: "destructive" })
      setIsLiked(originalIsLiked)
      setLikeCount(originalLikeCount)
      console.log("❤️ [DeckCard] Reverted UI state due to exception.")
    } finally {
      setIsLikeLoading(false)
      console.log("❤️ [DeckCard] Setting loading state to false.")
    }
    console.log("❤️ [DeckCard] handleLike called - END.")
  }

  const handleFavorite = async (event: React.MouseEvent) => {
    console.log("⭐ [DeckCard] handleFavorite called - START for deck ID:", deck.id)
    event.preventDefault()
    event.stopPropagation()
    console.log("⭐ [DeckCard] Event prevented and stopped.")

    if (!user) {
      console.log("⭐ [DeckCard] User not logged in - showing login modal for favorite.")
      setLoginModalType("favorite")
      setShowLoginModal(true)
      return
    }

    if (isFavoriteLoading) {
      console.log("⭐ [DeckCard] Already loading - returning.")
      return
    }

    setIsFavoriteLoading(true)
    const originalIsFavorited = isFavorited
    const originalFavoriteCount = favoriteCount
    console.log("⭐ [DeckCard] Current state before update:", { originalIsFavorited, originalFavoriteCount })

    setIsFavorited(!isFavorited)
    const newFavoriteCount = originalIsFavorited ? favoriteCount - 1 : favoriteCount + 1
    setFavoriteCount(newFavoriteCount)
    console.log("⭐ [DeckCard] UI updated immediately:", { newIsFavorited: !isFavorited, newFavoriteCount })

    try {
      const action = originalIsFavorited ? unfavoriteDeck : favoriteDeck
      console.log("⭐ [DeckCard] Calling action:", originalIsFavorited ? "unfavoriteDeck" : "favoriteDeck")
      const result = await action(deck.id)
      console.log("⭐ [DeckCard] Action result:", result)

      if (result.error) {
        console.error("⭐ [DeckCard] Action failed with error:", result.error)
        toast({ title: "エラー", description: result.error, variant: "destructive" })
        setIsFavorited(originalIsFavorited)
        setFavoriteCount(originalFavoriteCount)
        console.log("⭐ [DeckCard] Reverted UI state due to error.")
      } else {
        console.log("⭐ [DeckCard] Action successful.")
        if (onCountUpdate) {
          onCountUpdate(deck.id, likeCount, newFavoriteCount)
          console.log("⭐ [DeckCard] Called onCountUpdate callback.")
        }
        if (user) {
          const favoriteKey = `favorite_${user.id}_${deck.id}`
          const sourceTabKey = `favorite_source_${user.id}_${deck.id}`
          localStorage.setItem(favoriteKey, (!originalIsFavorited).toString())
          console.log(`⭐ [DeckCard] localStorage updated for favorite state: ${!originalIsFavorited}`)
          if (!originalIsFavorited) {
            const currentTab =
              deck.source_tab || deck.category || (deck.is_deck_page ? "Tierランキング" : "みんなのデッキ")
            localStorage.setItem(sourceTabKey, currentTab)
            console.log(`⭐ [DeckCard] localStorage updated for source tab: ${currentTab}`)
          }
        }
      }
    } catch (actionError) {
      console.error("⭐ [DeckCard] Exception during action:", actionError)
      toast({ title: "エラー", description: "操作に失敗しました", variant: "destructive" })
      setIsFavorited(originalIsFavorited)
      setFavoriteCount(originalFavoriteCount)
      console.log("⭐ [DeckCard] Reverted UI state due to exception.")
    } finally {
      setIsFavoriteLoading(false)
      console.log("⭐ [DeckCard] Setting loading state to false.")
    }
    console.log("⭐ [DeckCard] handleFavorite called - END.")
  }

  const handleLoginModalClose = () => {
    console.log("🔒 [DeckCard] Login modal closed.")
    setShowLoginModal(false)
  }

  const handleContinueAsGuest = () => {
    console.log("👤 [DeckCard] Continue as guest selected - closing modal.")
    setShowLoginModal(false)
  }

  return (
    <>
      <Link href={linkHref} className="block group">
        <Card className="h-full overflow-hidden transition-all duration-200 ease-in-out group-hover:shadow-xl group-hover:-translate-y-1 bg-white">
          <CardHeader className="p-3">
            <div className="flex justify-between items-start mb-2">
              <CardTitle className="text-purple-600 text-sm font-bold truncate group-hover:text-purple-700 flex-1">
                {deckName}
              </CardTitle>
              {statusBadge && (
                <Badge variant={statusBadge.variant} className="ml-2 text-xs flex-shrink-0">
                  {statusBadge.text}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-3 flex flex-col items-center">
            <div className="relative w-full max-w-[100px] aspect-[5/7] mb-2">
              <Image
                src={thumbnailImage.url || "/placeholder.svg"}
                alt={thumbnailImage.name}
                fill
                sizes="100px"
                className="object-contain rounded-md border border-slate-200 bg-slate-50"
              />
            </div>
            <p className="text-xs text-slate-700 font-medium truncate w-full text-center">
              {deck.thumbnail_image?.name || deckName}
            </p>
            <div className="flex items-center text-xs text-slate-500 mt-1">
              <CalendarDays className="h-3 w-3 mr-1 flex-shrink-0" />
              <span className="text-xs">更新: {new Date(updatedDate).toLocaleDateString("ja-JP")}</span>
            </div>
          </CardContent>
          <CardFooter className="p-2 bg-slate-50/70 border-t border-slate-200/80 flex justify-around items-center text-xs text-slate-600">
            <button
              onClick={handleLike}
              disabled={isLikeLoading}
              className={`flex items-center hover:bg-white rounded-md px-2 py-1 transition-colors ${
                isLiked ? "text-red-500" : "text-slate-600"
              } ${isLikeLoading ? "opacity-50 cursor-not-allowed" : "hover:text-red-500"}`}
              title="いいね"
              style={{ zIndex: 10, position: "relative" }}
            >
              {isLikeLoading ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <Heart className="h-3 w-3 mr-1" fill={isLiked ? "currentColor" : "none"} />
              )}
              <span className="text-xs">{likeCount}</span>
            </button>

            <button
              onClick={handleFavorite}
              disabled={isFavoriteLoading}
              className={`flex items-center hover:bg-white rounded-md px-2 py-1 transition-colors ${
                isFavorited ? "text-yellow-500" : "text-slate-600"
              } ${isFavoriteLoading ? "opacity-50 cursor-not-allowed" : "hover:text-yellow-500"}`}
              title="お気に入り"
              style={{ zIndex: 10, position: "relative" }}
            >
              {isFavoriteLoading ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <Star className="h-3 w-3 mr-1" fill={isFavorited ? "currentColor" : "none"} />
              )}
              <span className="text-xs">{favoriteCount}</span>
            </button>

            <div className="flex items-center" title="コメント数">
              <MessageCircle className="h-3 w-3 mr-1 text-blue-500" />
              <span className="text-xs">{deck.comment_count || 0}</span>
            </div>
          </CardFooter>
        </Card>
      </Link>

      {showLoginModal && (
        <LoginPromptModal
          onClose={handleLoginModalClose}
          onContinueAsGuest={handleContinueAsGuest}
          showContinueAsGuest={loginModalType === "like"}
        />
      )}
    </>
  )
}
