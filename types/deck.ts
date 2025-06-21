import type { Card } from "./card"

export interface DeckPage {
  id: string
  user_id: string | null
  deck_name: string
  deck_concept: string
  main_pokemon: string
  sub_pokemon: string | null
  deck_type: string
  card_list: Card[]
  strengths_weaknesses_list: StrengthWeakness[]
  how_to_play_list: HowToPlay[]
  created_at: string
  updated_at: string
  comment_count: number
  like_count: number
  favorite_count: number
  eval_count: number
  eval_value: number
  category: string | null
}

export interface StrengthWeakness {
  title: string
  image_urls?: string[]
  description: string
  display_order: number
}

export interface HowToPlay {
  title: string
  description: string
  display_order: number
}

export interface HowToPlayStep {
  title: string
  description: string
  image_urls?: string[] // ここを修正または追加
}

export interface DeckComment {
  id: string
  deck_page_id: string
  user_id: string | null
  user_name: string | null
  comment_text: string
  created_at: string
}

export interface DeckLike {
  deck_page_id: string
  user_id: string
  created_at: string
}

export interface DeckFavorite {
  deck_page_id: string
  user_id: string
  created_at: string
}

export interface DeckEvaluation {
  deck_page_id: string
  user_id: string
  score: number
  created_at: string
}
