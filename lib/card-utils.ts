export interface CardData {
  id: number
  name: string
  image_url: string
  thumb_url?: string
  type_code?: string
  rarity_code?: string
  category?: string
}

export function getCardImageUrl(card: CardData, useThumb = true): string {
  if (useThumb && card.thumb_url) {
    return card.thumb_url
  }
  return card.image_url || "/placeholder.svg?width=150&height=210"
}

export function getCardDisplayName(card: CardData): string {
  return card.name || "Unknown Card"
}
