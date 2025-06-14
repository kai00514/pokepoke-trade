import Image from "next/image"
import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Heart, Star, Eye, CalendarDays } from "lucide-react"

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
}

interface DeckCardProps {
  deck: Deck
}

export default function DeckCard({ deck }: DeckCardProps) {
  const deckName = deck.title || deck.name || "無題のデッキ"
  const updatedDate = deck.updated_at || deck.updatedAt || deck.created_at || new Date().toISOString()
  const cardCount = deck.deck_cards?.reduce((sum, card) => sum + card.quantity, 0) || 20

  // サムネイル画像を取得（WebP優先）
  const getThumbnailImage = () => {
    // 新しいサムネイル画像システム（cardsテーブルからJOIN）
    if (deck.thumbnail_image) {
      return {
        // WebP画像（thumb_url）を優先、フォールバックでimage_url
        url:
          deck.thumbnail_image.thumb_url || deck.thumbnail_image.image_url || "/placeholder.svg?width=150&height=210",
        name: deck.thumbnail_image.name,
      }
    }

    // フォールバック: 従来の単一画像
    if (deck.imageUrl) {
      return { url: deck.imageUrl, name: deckName }
    }

    // デフォルト画像
    return { url: "/placeholder.svg?width=150&height=210", name: deckName }
  }

  const thumbnailImage = getThumbnailImage()

  return (
    <Link href={`/decks/${deck.id}`} className="block group">
      <Card className="h-full overflow-hidden transition-all duration-200 ease-in-out group-hover:shadow-xl group-hover:-translate-y-1 bg-white">
        <CardHeader className="p-4">
          <CardTitle className="text-purple-600 text-lg font-bold truncate group-hover:text-purple-700">
            {deckName}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 flex flex-col items-center">
          {/* サムネイル画像表示 */}
          <div className="relative w-full aspect-[5/7] mb-3">
            <Image
              src={thumbnailImage.url || "/placeholder.svg"}
              alt={thumbnailImage.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-contain rounded-md border border-slate-200 bg-slate-50"
            />
          </div>
          <p className="text-sm text-slate-700 font-medium truncate w-full text-center">
            {deck.thumbnail_image?.name || deck.cardName || deckName}
          </p>
          <div className="flex items-center text-xs text-slate-500 mt-1">
            <CalendarDays className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
            <span>更新日: {new Date(updatedDate).toLocaleDateString("ja-JP")}</span>
          </div>
          <div className="text-xs text-slate-600 mt-1">{cardCount}枚のデッキ</div>
        </CardContent>
        <CardFooter className="p-3 bg-slate-50/70 border-t border-slate-200/80 flex justify-around items-center text-xs text-slate-600">
          <div className="flex items-center" title="いいね">
            <Heart className="h-3.5 w-3.5 mr-1 text-pink-500" />
            <span>{deck.likes || 0}</span>
          </div>
          <div className="flex items-center" title="お気に入り">
            <Star className="h-3.5 w-3.5 mr-1 text-amber-500" />
            <span>{deck.favorites || 0}</span>
          </div>
          <div className="flex items-center" title="閲覧数">
            <Eye className="h-3.5 w-3.5 mr-1 text-sky-500" />
            <span>{deck.views || 0}</span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  )
}
