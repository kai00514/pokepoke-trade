import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch (error) {
          // The `setAll` method was called from a Server Component.
          // This can be safely ignored as cookies will be set by the client-side auth flow.
          console.warn("Cookie setAll failed in server component:", error)
        }
      },
    },
  })
}

// Alias for compatibility
export { createClient as createServerClient }
