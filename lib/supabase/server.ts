import { createClient } from "@supabase/supabase-js"

export function createServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY!

  return createClient(supabaseUrl, supabaseKey)
}
