"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { createBrowserClient } from "@/lib/supabase/client"
import type { DeckCard } from "@/types/deck"

interface DeckCardsGridProps {
  deckName: string
  energyType: string
  energyImage?: string
  cards: DeckCard[]
}

interface CardData {
  id: string
  name: string
  image_url: string
  pack_name?: string
}

export function DeckCardsGrid({ deckName, energyType, energyImage, cards }: DeckCardsGridProps) {
  const [cardImages, setCardImages] = useState<Record<string, CardData>>({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchCardImages = async () => {
      if (!cards || cards.length === 0) {
        setIsLoading(false)
        return
      }

      try {
        const supabase = createBrowserClient()
        const cardIds = cards.map((card) => card.id).filter(Boolean)

        if (cardIds.length === 0) {
          setIsLoading(false)
          return
        }

        const { data, error } = await supabase.from("cards").select("id, name, image_url, pack_name").in("id", cardIds)

        if (error) {
          console.error("Error fetching card images:", error)
        } else if (data) {
          const cardMap = data.reduce(
            (acc, card) => {
              acc[card.id] = card
              return acc
            },
            {} as Record<string, CardData>,
          )
          setCardImages(cardMap)
        }
      } catch (error) {
        console.error("Error fetching card images:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCardImages()
  }, [cards])

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-500">カード情報を読み込み中...</p>
      </div>
    )
  }

  if (!cards || cards.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>デッキレシピ情報がありません</p>
      </div>
    )
  }

  // カードを2行10列のグリッドに配置
  const gridCards = Array(20).fill(null)
  cards.forEach((card, index) => {
    if (index < 20) {
      gridCards[index] = card
    }
  })

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

      {/* 2行10列のカードグリッド */}
      <div className="grid grid-cols-10 gap-2 mb-4">
        {gridCards.map((card, index) => (
          <div key={index} className="aspect-[7/10] relative">
            {card ? (
              <div className="relative w-full h-full">
                <Image
                  src={
                    cardImages[card.id]?.image_url ||
                    card.imageUrl ||
                    "/placeholder.svg?height=140&width=100&query=カード"
                  }
                  alt={cardImages[card.id]?.name || card.name || "カード"}
                  fill
                  className="object-cover rounded-lg shadow-sm"
                />
                {card.count > 1 && (
                  <div className="absolute bottom-1 right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {card.count}
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full h-full bg-gray-200 rounded-lg border-2 border-dashed border-gray-300"></div>
            )}
          </div>
        ))}
      </div>

      {/* カード一覧 */}
      <div className="space-y-2">
        <h5 className="font-medium text-sm text-gray-700">デッキ構成 ({cards.length}枚)</h5>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          {cards.map((card, index) => (
            <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
              <span className="font-medium">{cardImages[card.id]?.name || card.name}</span>
              <span className="text-gray-500">×{card.count}</span>
              {cardImages[card.id]?.pack_name && (
                <span className="text-xs text-gray-400">({cardImages[card.id].pack_name})</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
