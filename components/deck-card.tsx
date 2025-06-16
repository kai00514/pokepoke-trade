import Image from "next/image"
import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Heart, Star, MessageCircle, CalendarDays } from "lucide-react"

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
}

export default function DeckCard({ deck }: DeckCardProps) {
  const deckName = deck.title || deck.name || deck.deck_name || "無題のデッキ"
  const updatedDate = deck.updated_at || deck.updatedAt || deck.created_at || new Date().toISOString()
  const cardCount = deck.deck_cards?.reduce((sum, card) => sum + card.quantity, 0) || 20

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

  return (
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
          <div className="flex items-center" title="いいね">
            <Heart className="h-3 w-3 mr-1 text-pink-500" />
            <span className="text-xs">{deck.likes || deck.like_count || 0}</span>
          </div>
          <div className="flex items-center" title="お気に入り">
            <Star className="h-3 w-3 mr-1 text-amber-500" />
            <span className="text-xs">{deck.favorites || 0}</span>
          </div>
          <div className="flex items-center" title="コメント数">
            <MessageCircle className="h-3 w-3 mr-1 text-blue-500" />
            <span className="text-xs">{deck.comments || deck.comment_count || 0}</span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  )
}
