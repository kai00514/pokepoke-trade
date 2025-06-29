import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}

// Named exports for compatibility
export { createClient as createBrowserClient }
export const supabase = createClient()

// Default export for compatibility
export default createClient
