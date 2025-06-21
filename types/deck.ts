export interface Deck {
  id: string
  user_id?: string | null // ユーザーが作成したデッキの場合
  guest_name?: string | null // ゲストが作成したデッキの場合
  title: string // デッキのタイトル (decks.title または deck_pages.deck_name)
  description?: string | null // デッキの説明
  created_at: string
  updated_at: string
  like_count: number // いいね数
  favorite_count: number // お気に入り数
  comment_count: number // コメント数
  view_count: number // 閲覧数
  is_public?: boolean // 公開設定 (ユーザー作成デッキのみ)
  tags?: string[] // タグ (ユーザー作成デッキのみ)
  thumbnail_card_id?: number | null // サムネイルカードID (ユーザー作成デッキのみ)
  thumbnail_image?: {
    // サムネイルカード情報 (ユーザー作成デッキのみ)
    id: number
    name: string
    image_url: string
    thumb_url?: string
  }
  thumbnail_image_url?: string // サムネイル画像URL (deck_pagesのみ)
  is_deck_page: boolean // deck_pagesテーブルからのデータかどうか
  tier_rank?: number | null // Tierランク (deck_pagesのみ)
  category?: string | null // カテゴリ (deck_pagesのみ)
  user_display_name?: string | null // 作成者の表示名
  source_tab?: string // お気に入り一覧でどのタブから追加されたかを示すためのプロパティ
}
