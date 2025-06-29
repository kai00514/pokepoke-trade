import { createClient } from "@/lib/supabase/client"

interface UserProfile {
  id: string
  pokepoke_id?: string
  display_name?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase.from("users").select("*").eq("id", userId).single()

    if (error) {
      console.error("Error fetching user profile:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error in getUserProfile:", error)
    return null
  }
}

export async function createUserProfile(
  userId: string,
  profileData: Partial<UserProfile>,
): Promise<UserProfile | null> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("users")
      .insert({
        id: userId,
        ...profileData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating user profile:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error in createUserProfile:", error)
    return null
  }
}

export async function updateUserProfile(
  userId: string,
  profileData: Partial<UserProfile>,
): Promise<UserProfile | null> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("users")
      .update({
        ...profileData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single()

    if (error) {
      console.error("Error updating user profile:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error in updateUserProfile:", error)
    return null
  }
}
