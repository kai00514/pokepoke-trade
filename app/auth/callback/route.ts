import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/"
  const error = searchParams.get("error")
  const errorDescription = searchParams.get("error_description")

  console.log("🔄 Callback route called with:", {
    code: code ? "present" : "missing",
    next,
    error,
    errorDescription,
  })

  // エラーがある場合はエラーページにリダイレクト
  if (error) {
    console.error("❌ OAuth error:", error, errorDescription)
    return NextResponse.redirect(`${origin}/auth/login?error=${error}&description=${errorDescription}`)
  }

  if (code) {
    try {
      const supabase = await createClient()
      
      console.log("🔄 Exchanging code for session...")
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

      if (exchangeError) {
        console.error("❌ Session exchange failed:", exchangeError)
        return NextResponse.redirect(`${origin}/auth/login?error=callback_error&message=${exchangeError.message}`)
      }

      if (data?.session) {
        console.log("✅ Session exchange successful for user:", data.session.user.email)

        // セッションが確実に確立されたことを確認
        const { data: { session: verifiedSession } } = await supabase.auth.getSession()
        
        if (!verifiedSession) {
          console.error("❌ Session verification failed")
          return NextResponse.redirect(`${origin}/auth/login?error=session_verification_failed`)
        }

        // リダイレクトURLの構築（codeパラメータなし）
        let redirectUrl: string

        // デプロイ環境でのリダイレクト処理を改善
        const forwardedHost = request.headers.get("x-forwarded-host")
        const isLocalEnv = process.env.NODE_ENV === "development"

        if (isLocalEnv) {
          redirectUrl = `${origin}${next}`
        } else if (forwardedHost) {
          redirectUrl = `https://${forwardedHost}${next}`
        } else {
          // Vercelなどのデプロイ環境での処理
          const deployUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : origin
          redirectUrl = `${deployUrl}${next}`
        }

        console.log("🔄 Redirecting to:", redirectUrl)
        
        // レスポンスを作成し、セッションクッキーを確実に設定
        const response = NextResponse.redirect(redirectUrl)
        
        // セッションクッキーを手動で設定（必要に応じて）
        if (data.session.access_token) {
          response.cookies.set('sb-access-token', data.session.access_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7 // 7 days
          })
        }
        
        if (data.session.refresh_token) {
          response.cookies.set('sb-refresh-token', data.session.refresh_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 30 // 30 days
          })
        }
        
        return response
      } else {
        console.error("❌ No session after exchange")
        return NextResponse.redirect(`${origin}/auth/login?error=no_session`)
      }
    } catch (error) {
      console.error("❌ Callback error:", error)
      return NextResponse.redirect(`${origin}/auth/login?error=callback_error&message=Unexpected error`)
    }
  }

  console.log("❌ No code parameter found")
  return NextResponse.redirect(`${origin}/auth/login?error=no_code`)
}
