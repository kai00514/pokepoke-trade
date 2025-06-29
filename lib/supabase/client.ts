import { createClient as createSupabaseClient } from "@supabase/supabase-js"

// シングルトンパターンでクライアントを提供
let clientInstance: ReturnType<typeof createSupabaseClient> | null = null

export function createBrowserClient() {
  if (!clientInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Supabase URL or Anon Key is missing")
    }
    clientInstance = createSupabaseClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        auth: {
          flowType: "pkce",    // ← ここで PKCE（Authorization Code Flow）のみを指定
        },
      }
    )
  }
  return clientInstance
}

// Named export for createClient (required for deployment)
export const createClient = createBrowserClient

// 既存のクライアントインスタンスをエクスポート
export const supabase = createBrowserClient()
