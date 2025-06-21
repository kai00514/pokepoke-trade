"use client"
import { useEffect } from "react" // useState, useEffect, createBrowserClient, CardData を削除
import Image from "next/image"
// import { createBrowserClient } from "@/lib/supabase/client" // 削除
// import type { DeckCard } from "@/types/deck" // 削除

interface DeckCardWithDetails {
  card_id: number
  quantity: number
  name: string
  image_url: string
  thumb_url?: string
  pack_name?: string // pack_nameも表示のために含める
}

interface DeckCardsGridProps {
  deckName: string
  energyType: string
  energyImage?: string
  cards: DeckCardWithDetails[] // 型を更新
}

export function DeckCardsGrid({ deckName, energyType, energyImage, cards }: DeckCardsGridProps) {
  // クライアント側でのカード画像フェッチロジックはサーバーアクションに移動したため削除
  // const [cardImages, setCardImages] = useState<Record<string, CardData>>({})
  // const [isLoading, setIsLoading] = useState(true)

  // useEffect(() => {
  //   const fetchCardImages = async () => {
  //     if (!cards || cards.length === 0) {
  //       setIsLoading(false)
  //       return
  //     }

  //     try {
  //       const supabase = createBrowserClient()
  //       const cardIds = cards.map((card) => card.id).filter(Boolean)

  //       if (cardIds.length === 0) {
  //         setIsLoading(false)
  //         return
  //       }

  //       const { data, error } = await supabase.from("cards").select("id, name, image_url, pack_name").in("id", cardIds)

  //       if (error) {
  //         console.error("Error fetching card images:", error)
  //       } else if (data) {
  //         const cardMap = data.reduce(
  //           (acc, card) => {
  //             acc[card.id] = card
  //             return acc
  //           },
  //           {} as Record<string, CardData>,
  //         )
  //         setCardImages(cardMap)
  //       }
  //     } catch (error) {
  //       console.error("Error fetching card images:", error)
  //     } finally {
  //       setIsLoading(false)
  //     }
  //   }

  //   fetchCardImages()
  // }, [cards])

  // if (isLoading) {
  //   return (
  //     <div className="text-center py-8">
  //       <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
  //       <p className="text-gray-500">カード情報を読み込み中...</p>
  //     </div>
  //   )
  // }

  // cardsプロップがどのような状態で渡されているかを確認するログ
  useEffect(() => {
    console.log("DeckCardsGrid received cards prop:", cards)
  }, [cards])

  if (!cards || cards.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>デッキレシピ情報がありません</p>
      </div>
    )
  }

  // カードを20枚のグリッドに配置
  const gridCards: (DeckCardWithDetails | null)[] = Array(20).fill(null)
  let currentGridIndex = 0
  cards.forEach((card) => {
    for (let i = 0; i < card.quantity; i++) {
      if (currentGridIndex < 20) {
        gridCards[currentGridIndex] = card
        currentGridIndex++
      } else {
        break // 20枚を超えたら終了
      }
    }
  })

  const totalCards = cards.reduce((sum, card) => sum + card.quantity, 0)

  return (
    <div>
      <div className="bg-gray-50 p-4 rounded-lg mb-4">
        <div className="flex items-center gap-4 mb-2">
          <h4 className="font-medium text-lg">{deckName}</h4>
          <div className="flex items-center gap-2">
            {energyImage && (
              <Image
                src={energyImage || "/placeholder.svg"}
                alt={energyType}
                width={20}
                height={20}
                className="w-5 h-5"
              />
            )}
            <span className="text-sm text-gray-600">{energyType}タイプ</span>
          </div>
        </div>
      </div>

      {/* 20枚のカードグリッド */}
      <div className="grid grid-cols-10 gap-2 mb-4">
        {" "}
        {/* 2行10列なのでgrid-cols-10 */}
        {gridCards.map((card, index) => (
          <div key={index} className="aspect-[7/10] relative">
            {card ? (
              <div className="relative w-full h-full">
                <Image
                  src={card.image_url || "/placeholder.svg?height=140&width=100&query=カード"}
                  alt={card.name || "カード"}
                  fill
                  className="object-cover rounded-lg shadow-sm"
                  onError={(e) => {
                    console.error(`Failed to load image for card ID ${card.card_id}: ${card.image_url}`, e)
                    e.currentTarget.src = "/placeholder.svg?height=140&width=100"
                  }}
                />
              </div>
            ) : (
              <div className="w-full h-full bg-gray-200 rounded-lg border-2 border-dashed border-gray-300"></div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
