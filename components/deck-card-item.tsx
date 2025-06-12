"use client"

import type React from "react"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Minus, Plus, X } from "lucide-react"
import type { Card } from "@/components/detailed-search-modal"

type DeckCard = Card & { quantity: number }

interface DeckCardItemProps {
  card: DeckCard
  onQuantityChange: (cardId: string, newQuantity: number) => void
  onRemove: (cardId: string) => void
}

const MAX_CARD_QUANTITY = 4 // Standard rule for most cards

export default function DeckCardItem({ card, onQuantityChange, onRemove }: DeckCardItemProps) {
  const handleQuantityChange = (amount: number) => {
    const newQuantity = Math.max(0, Math.min(MAX_CARD_QUANTITY, card.quantity + amount))
    onQuantityChange(card.id, newQuantity)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseInt(e.target.value, 10)
    if (!isNaN(value)) {
      const newQuantity = Math.max(0, Math.min(MAX_CARD_QUANTITY, value))
      onQuantityChange(card.id, newQuantity)
    }
  }

  return (
    <div className="flex items-center bg-slate-100/70 p-2 rounded-md gap-3 relative group">
      <div className="flex-shrink-0 w-12 h-16 relative">
        <Image
          src={card.imageUrl || "/placeholder.svg"}
          alt={card.name}
          fill
          sizes="50px"
          className="object-contain rounded-sm"
        />
      </div>
      <div className="flex-grow min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">{card.name}</p>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <Button
          variant="outline"
          size="icon"
          className="h-6 w-6"
          onClick={() => handleQuantityChange(-1)}
          disabled={card.quantity <= 1}
        >
          <Minus className="h-3 w-3" />
        </Button>
        <Input
          type="number"
          className="h-6 w-10 text-center px-0"
          value={card.quantity}
          onChange={handleInputChange}
          min={1}
          max={MAX_CARD_QUANTITY}
        />
        <Button
          variant="outline"
          size="icon"
          className="h-6 w-6"
          onClick={() => handleQuantityChange(1)}
          disabled={card.quantity >= MAX_CARD_QUANTITY}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="absolute -top-2 -right-2 h-6 w-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-opacity"
        onClick={() => onRemove(card.id)}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  )
}
