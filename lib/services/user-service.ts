import { createBrowserClient } from "@/lib/supabase/client"

interface UserProfile {
  id: string
  pokepoke_id?: string
  display_name?: string
  email?: string
  created_at?: string
  updated_at?: string
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const supabase = createBrowserClient()

  try {
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

export async function createUserProfile(userId: string, email: string): Promise<UserProfile | null> {
  const supabase = createBrowserClient()

  try {
    const { data, error } = await supabase
      .from("users")
      .insert({
        id: userId,
        email: email,
        display_name: email.split("@")[0],
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

export async function updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile | null> {
  const supabase = createBrowserClient()

  try {
    const { data, error } = await supabase
      .from("users")
      .update({
        ...updates,
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
