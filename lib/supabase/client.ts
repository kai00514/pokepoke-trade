import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs"

// シングルトンパターンでクライアントを提供
let clientInstance: ReturnType<typeof createPagesBrowserClient> | null = null

export function createClient() {
  if (!clientInstance) {
    clientInstance = createPagesBrowserClient()
  }
  return clientInstance
}

// 互換エクスポート（既存コードとの互換性のため）
export const createBrowserClient = createClient
export const supabase = createClient()

// Default export for compatibility
export default createClient
