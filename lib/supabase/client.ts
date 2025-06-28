import { createClient as createSupabaseClient } from "@supabase/supabase-js"

// シングルトンパターンでクライアントを提供
let clientInstance: ReturnType<typeof createSupabaseClient> | null = null

export function createClient() {
  if (!clientInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Supabase URL or Anon Key is missing")
    }

    clientInstance = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  }
  return clientInstance
}

// createBrowserClient エイリアスを追加（既存のコードとの互換性のため）
export const createBrowserClient = createClient

// 既存のクライアントインスタンスをエクスポート
export const supabase = createClient()
