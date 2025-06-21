export interface Deck {
  id: string
  // 共通プロパティ
  title: string | null // decks.title または deck_pages.deck_name
  description: string | null // decks.description または deck_pages.deck_description
  created_at: string
  updated_at: string
  like_count: number
  favorite_count: number
  comment_count: number
  view_count: number

  // decksテーブル固有のプロパティ
  user_id?: string | null
  is_public?: boolean
  tags?: string[] | null
  thumbnail_card_id?: number | null
  thumbnail_image?: {
    // cardsテーブルからJOINされる情報
    id: number
    name: string
    image_url: string
    thumb_url?: string | null
  }
  user_display_name?: string | null // user_profilesからJOINされる情報

  // deck_pagesテーブル固有のプロパティ
  thumbnail_image_url?: string | null
  tier_rank?: number | null
  category?: string | null

  // UI表示用プロパティ
  is_deck_page: boolean // deck_pagesテーブルからのデータかどうかを判定
  source_tab?: string // お気に入り登録時のソースタブ (favoritesページでのみ使用)
}
