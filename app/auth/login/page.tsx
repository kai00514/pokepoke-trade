"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GoogleIcon } from "@/components/icons/google-icon"
import { XIcon } from "@/components/icons/twitter-icon"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        toast({
          title: "ログインエラー",
          description: error.message,
          variant: "destructive",
        })
      } else {
        toast({
          title: "ログイン成功",
          description: "ログインしました。",
        })
        router.push("/")
        router.refresh()
      }
    } catch (error) {
      toast({
        title: "エラー",
        description: "ログインに失敗しました。",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSocialLogin = async (provider: "google" | "twitter") => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        toast({
          title: "ログインエラー",
          description: error.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "エラー",
        description: "ソーシャルログインに失敗しました。",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">ログイン</CardTitle>
          <CardDescription className="text-center">アカウントにログインしてください</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="メールアドレス"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="パスワード"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "ログイン中..." : "ログイン"}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">または</span>
            </div>
          </div>

          <div className="space-y-2">
            <Button variant="outline" className="w-full bg-transparent" onClick={() => handleSocialLogin("google")}>
              <GoogleIcon className="mr-2 h-4 w-4" />
              Googleでログイン
            </Button>
            <Button variant="outline" className="w-full bg-transparent" onClick={() => handleSocialLogin("twitter")}>
              <XIcon className="mr-2 h-4 w-4" />
              Twitterでログイン
            </Button>
          </div>

          <div className="text-center text-sm">
            <span className="text-gray-600">アカウントをお持ちでない方は </span>
            <Link href="/auth/signup" className="text-blue-600 hover:underline">
              新規登録
            </Link>
          </div>

          <div className="text-center text-sm">
            <Link href="/auth/reset" className="text-blue-600 hover:underline">
              パスワードを忘れた方はこちら
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
