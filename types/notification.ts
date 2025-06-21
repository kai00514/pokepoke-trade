export interface TradeNotification {
  id: string
  user_id: string
  type: "trade_comment" | "trade_comment_reply"
  content: string
  related_id: string
  is_read: boolean
  created_at: string
}

export interface DeckNotification {
  id: string
  user_id: string
  type: "deck_comment" | "deck_comment_reply"
  content: string
  related_id: string
  is_read: boolean
  created_at: string
}

export type Notification = (TradeNotification | DeckNotification) & {
  category: "trade" | "deck"
}
