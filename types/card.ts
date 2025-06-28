export interface Card {
  id: number
  name: string
  image_url?: string
  pack_name?: string
  type?: string
  rarity?: string
  hp?: number
  attack?: number
  defense?: number
  retreat_cost?: number
  weakness?: string
  resistance?: string
  description?: string
  created_at?: string
  updated_at?: string
  pack_id?: string // パックIDを追加
}
