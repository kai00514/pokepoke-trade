"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Heart, Star, MessageCircle, CalendarDays, Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { likeDeck, unlikeDeck, favoriteDeck, unfavoriteDeck } from "@/lib/services/deck-service"
import { useToast } from "@/components/ui/use-toast"
import LoginPromptModal from "@/components/ui/login-prompt-modal"

export interface Deck {
  id: string
  user_id?: string
  title?: string
  name?: string // サンプルデータ用
  description?: string
  imageUrl?: string
  cardName?: string // サンプルデータ用
  updatedAt?: string // サンプルデータ用
  updated_at?: string // データベース用
  created_at?: string
  likes?: number
  favorites?: number
  views?: number
  comments?: number // コメント数を追加
  is_public?: boolean
  tags?: string[]
  deck_cards?: Array<{
    card_id: number
    quantity: number
  }>
  thumbnail_card_id?: number
  thumbnail_image?: {
    id: number
    name: string
    image_url: string
    thumb_url?: string
  }
  // deck_pagesテーブル用のプロパティ
  deck_name?: string
  thumbnail_image_url?: string
  tier_rank?: number
  view_count?: number
  like_count?: number
  comment_count?: number
  is_deck_page?: boolean // deck_pagesテーブルのデータかどうかを判定
}

interface DeckCardProps {
  deck: Deck
  onCountUpdate?: (deckId: string, likeCount: number, favoriteCount: number) => void
}

export default function DeckCard({ deck, onCountUpdate }: DeckCardProps) {
  console.log("🔄 DeckCard component rendered for deck:", deck.id, deck.title || deck.name)

  const { user } = useAuth()
  const { toast } = useToast()

  // ローカル状態でいいね・お気に入りの状態とカウントを管理
  const [isLiked, setIsLiked] = useState(false)
  const [isFavorited, setIsFavorited] = useState(false)
  const [likeCount, setLikeCount] = useState(deck.likes || deck.like_count || 0)
  const [favoriteCount, setFavoriteCount] = useState(deck.favorites || 0)
  const [isLikeLoading, setIsLikeLoading] = useState(false)
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [loginModalType, setLoginModalType] = useState<"like" | "favorite">("like") // 新しい状態を追加

  console.log("📊 DeckCard initial state:", {
    deckId: deck.id,
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
      "🔧 DeckCard useEffect triggered - user changed:",
      user ? `${user.id} (${user.email})` : "not logged in",
    )
  }, [user])

  const deckName = deck.title || deck.name || deck.deck_name || "無題のデッキ"
  const updatedDate = deck.updated_at || deck.updatedAt || deck.created_at || new Date().toISOString()

  // リンク先を決定（deck_pagesテーブルのデータは/content/[id]、通常のデッキは/decks/[id]）
  const linkHref = deck.is_deck_page ? `/content/${deck.id}` : `/decks/${deck.id}`

  // サムネイル画像を取得（WebP優先）
  const getThumbnailImage = () => {
    // deck_pagesテーブルの場合
    if (deck.thumbnail_image_url) {
      return {
        url: deck.thumbnail_image_url,
        name: deckName,
      }
    }

    // 新しいサムネイル画像システム（cardsテーブルからJOIN）
    if (deck.thumbnail_image) {
      return {
        // WebP画像（thumb_url）を優先、フォールバックでimage_url
        url:
          deck.thumbnail_image.thumb_url || deck.thumbnail_image.image_url || "/placeholder.svg?width=120&height=168",
        name: deck.thumbnail_image.name,
      }
    }

    // フォールバック: 従来の単一画像
    if (deck.imageUrl) {
      return { url: deck.imageUrl, name: deckName }
    }

    // デフォルト画像
    return { url: "/placeholder.svg?width=120&height=168", name: deckName }
  }

  const thumbnailImage = getThumbnailImage()

  const handleLike = async (event: React.MouseEvent) => {
    console.log("❤️ handleLike called - START")
    console.log("❤️ Event details:", {
      type: event.type,
      target: event.target,
      currentTarget: event.currentTarget,
      bubbles: event.bubbles,
      cancelable: event.cancelable,
    })

    try {
      event.preventDefault() // Linkの遷移を防ぐ
      event.stopPropagation() // イベントの伝播を停止
      console.log("❤️ Event prevented and stopped")

      console.log("❤️ Current user state:", user ? `${user.id} (${user.email})` : "not logged in")

      // いいねはログインしていなくても実行可能
      console.log("❤️ Like is available for both logged in and guest users")

      if (isLikeLoading) {
        console.log("❤️ Already loading - returning")
        return
      }

      console.log("❤️ Setting loading state to true")
      setIsLikeLoading(true)

      const originalIsLiked = isLiked
      const originalLikeCount = likeCount

      console.log("❤️ Current state before update:", {
        originalIsLiked,
        originalLikeCount,
        deckId: deck.id,
      })

      // UIを即座に更新
      console.log("❤️ Updating UI state")
      setIsLiked(!isLiked)
      const newLikeCount = originalIsLiked ? likeCount - 1 : likeCount + 1
      setLikeCount(newLikeCount)
      console.log("❤️ UI updated:", { newIsLiked: !isLiked, newLikeCount })

      try {
        const action = originalIsLiked ? unlikeDeck : likeDeck
        console.log("❤️ Calling action:", originalIsLiked ? "unlikeDeck" : "likeDeck")
        console.log("❤️ Action function:", action)

        const result = await action(deck.id)
        console.log("❤️ Action result:", result)

        if (result.error) {
          console.error("❤️ Action failed with error:", result.error)
          toast({ title: "エラー", description: result.error, variant: "destructive" })
          // エラー時はUIの状態を元に戻す
          console.log("❤️ Reverting UI state due to error")
          setIsLiked(originalIsLiked)
          setLikeCount(originalLikeCount)
        } else {
          console.log("❤️ Action successful")
          // 親コンポーネントに更新を通知（オプション）
          if (onCountUpdate) {
            console.log("❤️ Calling onCountUpdate callback")
            onCountUpdate(deck.id, newLikeCount, favoriteCount)
          }
        }
      } catch (actionError) {
        console.error("❤️ Exception during action:", actionError)
        toast({ title: "エラー", description: "操作に失敗しました", variant: "destructive" })
        console.log("❤️ Reverting UI state due to exception")
        setIsLiked(originalIsLiked)
        setLikeCount(originalLikeCount)
      } finally {
        console.log("❤️ Setting loading state to false")
        setIsLikeLoading(false)
      }
    } catch (outerError) {
      console.error("❤️ Outer exception in handleLike:", outerError)
      setIsLikeLoading(false)
    }

    console.log("❤️ handleLike called - END")
  }

  const handleFavorite = async (event: React.MouseEvent) => {
    console.log("⭐ handleFavorite called - START")
    console.log("⭐ Event details:", {
      type: event.type,
      target: event.target,
      currentTarget: event.currentTarget,
      bubbles: event.bubbles,
      cancelable: event.cancelable,
    })

    try {
      event.preventDefault() // Linkの遷移を防ぐ
      event.stopPropagation() // イベントの伝播を停止
      console.log("⭐ Event prevented and stopped")

      console.log("⭐ Current user state:", user ? `${user.id} (${user.email})` : "not logged in")

      // お気に入りは会員ユーザーのみ実行可能
      if (!user) {
        console.log("⭐ User not logged in - showing login modal for favorite")
        setLoginModalType("favorite") // お気に入り用のモーダルタイプを設定
        setShowLoginModal(true)
        return
      }

      if (isFavoriteLoading) {
        console.log("⭐ Already loading - returning")
        return
      }

      console.log("⭐ Setting loading state to true")
      setIsFavoriteLoading(true)

      const originalIsFavorited = isFavorited
      const originalFavoriteCount = favoriteCount

      console.log("⭐ Current state before update:", {
        originalIsFavorited,
        originalFavoriteCount,
        deckId: deck.id,
      })

      // UIを即座に更新
      console.log("⭐ Updating UI state")
      setIsFavorited(!isFavorited)
      const newFavoriteCount = originalIsFavorited ? favoriteCount - 1 : favoriteCount + 1
      setFavoriteCount(newFavoriteCount)
      console.log("⭐ UI updated:", { newIsFavorited: !isFavorited, newFavoriteCount })

      try {
        const action = originalIsFavorited ? unfavoriteDeck : favoriteDeck
        console.log("⭐ Calling action:", originalIsFavorited ? "unfavoriteDeck" : "favoriteDeck")
        console.log("⭐ Action function:", action)

        const result = await action(deck.id)
        console.log("⭐ Action result:", result)

        if (result.error) {
          console.error("⭐ Action failed with error:", result.error)
          toast({ title: "エラー", description: result.error, variant: "destructive" })
          // エラー時はUIの状態を元に戻す
          console.log("⭐ Reverting UI state due to error")
          setIsFavorited(originalIsFavorited)
          setFavoriteCount(originalFavoriteCount)
        } else {
          console.log("⭐ Action successful")
          // 親コンポーネントに更新を通知（オプション）
          if (onCountUpdate) {
            console.log("⭐ Calling onCountUpdate callback")
            onCountUpdate(deck.id, likeCount, newFavoriteCount)
          }
        }
      } catch (actionError) {
        console.error("⭐ Exception during action:", actionError)
        toast({ title: "エラー", description: "操作に失敗しました", variant: "destructive" })
        console.log("⭐ Reverting UI state due to exception")
        setIsFavorited(originalIsFavorited)
        setFavoriteCount(originalFavoriteCount)
      } finally {
        console.log("⭐ Setting loading state to false")
        setIsFavoriteLoading(false)
      }
    } catch (outerError) {
      console.error("⭐ Outer exception in handleFavorite:", outerError)
      setIsFavoriteLoading(false)
    }

    console.log("⭐ handleFavorite called - END")
  }

  const handleLoginModalClose = () => {
    console.log("🔒 Login modal closed")
    setShowLoginModal(false)
  }

  const handleContinueAsGuest = () => {
    console.log("👤 Continue as guest selected - closing modal")
    setShowLoginModal(false)
  }

  console.log("🎨 DeckCard rendering with current state:", {
    deckId: deck.id,
    isLiked,
    isFavorited,
    likeCount,
    favoriteCount,
    isLikeLoading,
    isFavoriteLoading,
    showLoginModal,
  })

  return (
    <>
      <Link href={linkHref} className="block group">
        <Card className="h-full overflow-hidden transition-all duration-200 ease-in-out group-hover:shadow-xl group-hover:-translate-y-1 bg-white">
          <CardHeader className="p-3">
            <CardTitle className="text-purple-600 text-sm font-bold truncate group-hover:text-purple-700">
              {deckName}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 flex flex-col items-center">
            {/* サムネイル画像表示 - ポケモンカードの5:7比率に最適化 */}
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
              {deck.thumbnail_image?.name || deck.cardName || deckName}
            </p>
            <div className="flex items-center text-xs text-slate-500 mt-1">
              <CalendarDays className="h-3 w-3 mr-1 flex-shrink-0" />
              <span className="text-xs">更新: {new Date(updatedDate).toLocaleDateString("ja-JP")}</span>
            </div>
          </CardContent>
          <CardFooter className="p-2 bg-slate-50/70 border-t border-slate-200/80 flex justify-around items-center text-xs text-slate-600">
            <button
              onClick={(e) => {
                console.log("🖱️ Like button clicked - event:", e)
                handleLike(e)
              }}
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
              onClick={(e) => {
                console.log("🖱️ Favorite button clicked - event:", e)
                handleFavorite(e)
              }}
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
              <span className="text-xs">{deck.comments || deck.comment_count || 0}</span>
            </div>
          </CardFooter>
        </Card>
      </Link>

      {/* ログイン誘導モーダル */}
      {showLoginModal && (
        <LoginPromptModal
          onClose={handleLoginModalClose}
          onContinueAsGuest={handleContinueAsGuest}
          showContinueAsGuest={loginModalType === "like"} // いいねの場合のみ表示
        />
      )}
    </>
  )
}
