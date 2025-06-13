import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// シングルトンパターンでクライアントを提供
let clientInstance: ReturnType<typeof createClient> | null = null

// Helper function to detect if we're in v0 preview environment
function isV0Environment() {
  return typeof window !== "undefined" && window.location.hostname.includes("vusercontent.net")
}

// Mock Supabase client for v0 environment
const mockSupabaseClient = {
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({
      data: { subscription: { unsubscribe: () => {} } },
    }),
    signInWithOAuth: async () => ({ data: null, error: null }),
    signOut: async () => ({ error: null }),
  },
  from: () => ({
    select: () => ({ data: [], error: null }),
    insert: () => ({ data: null, error: null }),
    update: () => ({ data: null, error: null }),
    delete: () => ({ data: null, error: null }),
  }),
}

export function createBrowserClient() {
  // Return mock client for v0 environment
  if (isV0Environment()) {
    console.log("V0 environment detected, returning mock Supabase client")
    return mockSupabaseClient as any
  }

  if (!clientInstance) {
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn("Supabase URL or Anon Key is missing, returning mock client")
      return mockSupabaseClient as any
    }

    try {
      clientInstance = createClient(supabaseUrl, supabaseAnonKey)
    } catch (error) {
      console.error("Failed to create Supabase client:", error)
      return mockSupabaseClient as any
    }
  }
  return clientInstance
}
