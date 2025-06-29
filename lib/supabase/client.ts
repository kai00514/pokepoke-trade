import { createBrowserSupabaseClient } from "@supabase/auth-helpers-nextjs"

// シングルトンパターンでクライアントを提供
let clientInstance: ReturnType<typeof createBrowserSupabaseClient> | null = null

export function createBrowserClient() {
  if (!clientInstance) {
    clientInstance = createBrowserSupabaseClient({
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      options: { auth: { flowType: "pkce" } } // PKCE 明示（任意）
    })
  }
  return clientInstance
}

// 互換エクスポート
export const createClient = createBrowserClient
export const supabase     = createBrowserClient()
