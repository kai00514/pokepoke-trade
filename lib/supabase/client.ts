import { createClient } from "@supabase/supabase-js"

// シングルトンパターンでクライアントを提供
let clientInstance: ReturnType<typeof createClient> | null = null

export function createBrowserClient() {
  if (!clientInstance) {
    clientInstance = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  }
  return clientInstance
}

// Named exports for compatibility
export { createBrowserClient as createClient }
export const supabase = createBrowserClient()

// Default export for compatibility
export default createBrowserClient
