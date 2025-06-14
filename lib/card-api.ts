import { createBrowserClient } from "@/lib/supabase/client"

const supabase = createBrowserClient()

export interface CardData {
  id: number
  name: string
  image_url: string
  thumb_url?: string
  type_code?: string
  rarity_code?: string
  category?: string
}

export async function fetchCardDetailsByIds(cardIds: string[]): Promise<CardData[]> {
  try {
    const numericIds = cardIds.map((id) => Number.parseInt(id, 10)).filter((id) => !isNaN(id))

    if (numericIds.length === 0) {
      return []
    }

    const { data, error } = await supabase
      .from("cards")
      .select("id, name, image_url, thumb_url, type_code, rarity_code, category")
      .in("id", numericIds)

    if (error) {
      console.error("Error fetching card details:", error)
      return []
    }

    return data || []
  } catch (err) {
    console.error("Error in fetchCardDetailsByIds:", err)
    return []
  }
}

export async function fetchCardById(cardId: string | number): Promise<CardData | null> {
  try {
    const numericId = typeof cardId === "string" ? Number.parseInt(cardId, 10) : cardId

    if (isNaN(numericId)) {
      return null
    }

    const { data, error } = await supabase
      .from("cards")
      .select("id, name, image_url, thumb_url, type_code, rarity_code, category")
      .eq("id", numericId)
      .single()

    if (error) {
      console.error("Error fetching card:", error)
      return null
    }

    return data
  } catch (err) {
    console.error("Error in fetchCardById:", err)
    return null
  }
}
