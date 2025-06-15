export interface DeckListItem {
  id: string
  title: string
  deck_name: string
  thumbnail_image_url?: string
  tier_rank?: number
  view_count: number
  like_count: number
  comment_count: number
  updated_at: string
  is_published: boolean
}

export interface DeckListResponse {
  decks: DeckListItem[]
  total: number
  hasMore: boolean
}
