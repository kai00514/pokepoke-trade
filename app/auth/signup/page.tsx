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

export default function SignupPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast({
        title: "パスワードエラー",
        description: "パスワードが一致しません。",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        toast({
          title: "登録エラー",
          description: error.message,
          variant: "destructive",
        })
      } else {
        toast({
          title: "登録完了",
          description: "メールアドレスに確認メールを送信しました。",
        })
        router.push("/auth/login")
      }
    } catch (error) {
      toast({
        title: "エラー",
        description: "登録に失敗しました。",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSocialSignup = async (provider: "google" | "twitter") => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            prompt: "consent",
          },
        },
      })

      if (error) {
        toast({
          title: "登録エラー",
          description: error.message,
          variant: "destructive",
        })
        return
      }

      // Code Flow 用の URL を受け取ってリダイレクト
      if (data?.url) {
        window.location.href = data.url
      }
    } catch (error) {
      toast({
        title: "エラー",
        description: "ソーシャル登録に失敗しました。",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">新規登録</CardTitle>
          <CardDescription className="text-center">新しいアカウントを作成してください</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleEmailSignup} className="space-y-4">
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
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="パスワード確認"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "登録中..." : "新規登録"}
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
            <Button variant="outline" className="w-full bg-transparent" onClick={() => handleSocialSignup("google")}>
              <GoogleIcon className="mr-2 h-4 w-4" />
              Googleで登録
            </Button>
            <Button variant="outline" className="w-full bg-transparent" onClick={() => handleSocialSignup("twitter")}>
              <XIcon className="mr-2 h-4 w-4" />
              Twitterで登録
            </Button>
          </div>

          <div className="text-center text-sm">
            <span className="text-gray-600">すでにアカウントをお持ちの方は </span>
            <Link href="/auth/login" className="text-blue-600 hover:underline">
              ログイン
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
