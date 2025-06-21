export interface Notification {
  id: string
  user_id: string
  type: string
  content: string
  related_id: string | null
  is_read: boolean
  created_at: string
  source: "trade" | "deck"
}
