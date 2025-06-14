export interface DeckWithCards {
  id: string
  title: string
  description?: string
  user_id: string
  user_display_name?: string
  is_public: boolean
  tags?: string[]
  thumbnail_card_id?: number
  created_at: string
  updated_at: string
  like_count?: number
  favorite_count?: number
  view_count?: number
  deck_cards: Array<{
    card_id: number
    quantity: number
  }>
}

export interface DeckCard {
  card_id: number
  quantity: number
}

export interface CreateDeckData {
  title: string
  description?: string
  is_public: boolean
  tags?: string[]
  deck_cards: DeckCard[]
  thumbnail_card_id?: number
}
