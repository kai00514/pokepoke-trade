export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      cards: {
        Row: {
          id: number
          name: string
          image_url: string
          type: string | null
          rarity: string | null
          set_id: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          image_url: string
          type?: string | null
          rarity?: string | null
          set_id?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          image_url?: string
          type?: string | null
          rarity?: string | null
          set_id?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      trade_comments: {
        Row: {
          id: string
          post_id: string
          user_id: string | null
          user_name: string
          content: string
          is_guest: boolean
          is_deleted: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id?: string | null
          user_name: string
          content: string
          is_guest?: boolean
          is_deleted?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string | null
          user_name?: string
          content?: string
          is_guest?: boolean
          is_deleted?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      trade_notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          content: string
          related_id: string | null
          is_read: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          content: string
          related_id?: string | null
          is_read?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          content?: string
          related_id?: string | null
          is_read?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      trade_post_offered_cards: {
        Row: {
          id: string
          post_id: string
          card_id: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          post_id: string
          card_id: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          card_id?: number
          created_at?: string
          updated_at?: string
        }
      }
      trade_post_wanted_cards: {
        Row: {
          id: string
          post_id: string
          card_id: number
          is_primary: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          post_id: string
          card_id: number
          is_primary?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          card_id?: number
          is_primary?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      trade_posts: {
        Row: {
          id: string
          title: string
          owner_id: string
          custom_id: string | null
          comment: string | null
          want_card_id: number | null
          status: string
          is_authenticated: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          owner_id: string
          custom_id?: string | null
          comment?: string | null
          want_card_id?: number | null
          status?: string
          is_authenticated?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          owner_id?: string
          custom_id?: string | null
          comment?: string | null
          want_card_id?: number | null
          status?: string
          is_authenticated?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
