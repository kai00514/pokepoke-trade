// 既存のSupabaseクライアントを使用するバージョン
import { supabase } from "./supabase/client" // 既存のSupabaseクライアントを使用
import type { Card } from "../types/card"

export async function getCardsByIds(cardIds: number[]): Promise<Card[]> {
  console.log("Fetching cards by IDs:", cardIds)

  if (cardIds.length === 0) {
    return []
  }

  const { data, error } = await supabase.from("cards").select("*").in("id", cardIds)

  if (error) {
    console.error("Failed to fetch cards:", error)
    throw new Error(`Failed to fetch cards: ${error.message}`)
  }

  console.log("Fetched cards:", data)
  return data || []
}

export async function getCardById(cardId: number): Promise<Card | null> {
  console.log("Fetching card by ID:", cardId)

  const { data, error } = await supabase.from("cards").select("*").eq("id", cardId).single()

  if (error) {
    if (error.code === "PGRST116") {
      // No rows returned
      console.warn("Card not found:", cardId)
      return null
    }
    console.error("Failed to fetch card:", error)
    throw new Error(`Failed to fetch card: ${error.message}`)
  }

  return data
}
