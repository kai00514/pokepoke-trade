export interface Deck {
  id: string
  title: string | null // タイトルをnull許容にする
  description: string
  thumbnail_image_url?: string | null
  like_count: number
  favorite_count: number
  comment_count: number
  created_at: string
  updated_at: string
  view_count: number
  is_deck_page?: boolean // デッキページかどうか (任意)
  source_tab?: string // お気に入り登録時のソースタブ (任意)
}
