import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/"

  console.log("Callback route called with code:", code ? "present" : "missing")

  if (code) {
    try {
      const supabase = await createClient()
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)

      if (!error && data.session) {
        console.log("Session exchange successful, user:", data.session.user.email)

        // デプロイ環境でのリダイレクト処理を改善
        const forwardedHost = request.headers.get("x-forwarded-host")
        const isLocalEnv = process.env.NODE_ENV === "development"

        if (isLocalEnv) {
          return NextResponse.redirect(`${origin}${next}`)
        } else if (forwardedHost) {
          return NextResponse.redirect(`https://${forwardedHost}${next}`)
        } else {
          // Vercelなどのデプロイ環境での処理
          const deployUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : origin
          return NextResponse.redirect(`${deployUrl}${next}`)
        }
      } else {
        console.error("Session exchange failed:", error)
        return NextResponse.redirect(`${origin}/auth/login?error=callback_error`)
      }
    } catch (error) {
      console.error("Callback error:", error)
      return NextResponse.redirect(`${origin}/auth/login?error=callback_error`)
    }
  }

  console.log("No code parameter found")
  return NextResponse.redirect(`${origin}/auth/login?error=no_code`)
}
