"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { fetchCardById } from "@/lib/card-api"
import type { CardData } from "@/lib/card-utils"
import { getCardImageUrl } from "@/lib/card-utils"

interface CardDisplayProps {
  cardId: string | number
  useThumb?: boolean
  className?: string
  width?: number
  height?: number
}

export default function CardDisplay({
  cardId,
  useThumb = true,
  className,
  width = 150,
  height = 210,
}: CardDisplayProps) {
  const [card, setCard] = useState<CardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadCard() {
      try {
        setLoading(true)
        setError(null)
        const cardData = await fetchCardById(cardId)
        setCard(cardData)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load card")
      } finally {
        setLoading(false)
      }
    }

    if (cardId) {
      loadCard()
    }
  }, [cardId])

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-md ${className}`} style={{ width, height }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (error || !card) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-md ${className}`} style={{ width, height }}>
        <span className="text-gray-500 text-sm">カード読み込みエラー</span>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`} style={{ width, height }}>
      <Image
        src={getCardImageUrl(card, useThumb) || "/placeholder.svg"}
        alt={card.name}
        fill
        className="object-contain rounded-md"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />
    </div>
  )
}
