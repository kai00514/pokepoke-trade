"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Mail, Lock, Eye, EyeOff } from "lucide-react"
import { GoogleIcon } from "@/components/icons/google-icon"
import { LineIcon } from "@/components/icons/line-icon"
import { XIcon } from "@/components/icons/twitter-icon" // TwitterIconをインポート
import { createBrowserClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showEmailForm, setShowEmailForm] = useState(false)

  const { toast } = useToast()
  const router = useRouter()
  const supabase = createBrowserClient()

  const handleSocialSignUp = async (provider: "google" | "twitter") => {
    try {
      setIsLoading(true)
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/`,
        },
      })

      if (error) {
        toast({
          title: "認証エラー",
          description: error.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "エラー",
        description: "予期しないエラーが発生しました。",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast({
        title: "パスワードエラー",
        description: "パスワードが一致しません。",
        variant: "destructive",
      })
      return
    }

    if (password.length < 6) {
      toast({
        title: "パスワードエラー",
        description: "パスワードは6文字以上で入力してください。",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/`,
        },
      })

      if (error) {
        toast({
          title: "新規登録エラー",
          description: error.message,
          variant: "destructive",
        })
      } else {
        toast({
          title: "確認メール送信",
          description: "確認メールを送信しました。メールをご確認ください。",
        })
        router.push("/auth/login")
      }
    } catch (error) {
      toast({
        title: "エラー",
        description: "予期しないエラーが発生しました。",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (showEmailForm) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">メールアドレスで新規登録</h1>
        <p className="text-sm text-slate-500 mb-8">アカウント情報を入力してください</p>

        <form onSubmit={handleEmailSignUp} className="space-y-4 text-left">
          <div>
            <label className="text-sm font-medium text-slate-700">メールアドレス</label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                type="email"
                placeholder="あなたのメールアドレス"
                className="pl-10 h-12"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">パスワード</label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                type={passwordVisible ? "text" : "password"}
                placeholder="パスワード（6文字以上）"
                className="pl-10 pr-10 h-12"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setPasswordVisible(!passwordVisible)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {passwordVisible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">パスワード確認</label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                type={confirmPasswordVisible ? "text" : "password"}
                placeholder="パスワードを再入力"
                className="pl-10 pr-10 h-12"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {confirmPasswordVisible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>
          <Button
            type="submit"
            className="w-full bg-purple-500 hover:bg-purple-600 text-white h-12 text-base"
            disabled={isLoading}
          >
            {isLoading ? "登録中..." : "新規登録"}
          </Button>
        </form>

        <Button
          variant="ghost"
          onClick={() => setShowEmailForm(false)}
          className="w-full mt-4 text-purple-600 hover:text-purple-700"
        >
          ← 他の登録方法を選択
        </Button>
      </div>
    )
  }

  return (
    <div className="text-center">
      <h1 className="text-2xl font-bold text-slate-800 mb-2">会員登録</h1>
      <p className="text-sm text-slate-500 mb-8">アカウントを作成してポケモンカードの取引を始めましょう</p>

      <div className="space-y-3">
        <Button
          variant="outline"
          className="w-full justify-between items-center p-6 bg-white"
          onClick={() => setShowEmailForm(true)}
          disabled={isLoading}
        >
          <div className="flex items-center">
            <Mail className="h-5 w-5 mr-3 text-purple-500" />
            <span className="font-semibold text-slate-700">メールアドレスで新規登録</span>
          </div>
          <span className="text-slate-400">→</span>
        </Button>
        <Button
          variant="outline"
          className="w-full justify-between items-center p-6 bg-white"
          onClick={() => handleSocialSignUp("google")}
          disabled={isLoading}
        >
          <div className="flex items-center">
            <GoogleIcon className="h-5 w-5 mr-3" />
            <span className="font-semibold text-slate-700">Googleで登録</span>
          </div>
          <span className="text-slate-400">→</span>
        </Button>
        <Button
          variant="outline"
          className="w-full justify-between items-center p-6 bg-white"
          onClick={() => handleSocialSignUp("twitter")}
          disabled={isLoading}
        >
          <div className="flex items-center">
            <XIcon className="h-5 w-5 mr-3" />
            <span className="font-semibold text-slate-700">Xで登録</span>
          </div>
          <span className="text-slate-400">→</span>
        </Button>
        <Button variant="outline" className="w-full justify-between items-center p-6 bg-white" disabled>
          <div className="flex items-center">
            <LineIcon className="h-5 w-5 mr-3" />
            <span className="font-semibold text-slate-400">LINEで登録（準備中）</span>
          </div>
          <span className="text-slate-400">→</span>
        </Button>
      </div>

      <div className="text-xs text-slate-500 mt-8 space-y-4">
        <p>※ソーシャルログイン機能は現在ブラウザのみで提供しています。</p>
        <p>
          会員登録は
          <Link href="/terms" className="text-purple-600 hover:underline">
            利用規約
          </Link>
          および
          <Link href="/privacy" className="text-purple-600 hover:underline">
            プライバシーポリシー
          </Link>
          に同意したとみなします。
          <br />
          ご確認の上、会員登録を進めてください。
        </p>
      </div>

      <div className="mt-8">
        <p className="text-sm text-slate-600 mb-3">すでにアカウントをお持ちの方</p>
        <Button
          asChild
          variant="outline"
          className="w-full border-purple-600 text-purple-600 bg-white hover:bg-purple-50 hover:text-purple-700 p-6"
        >
          <Link href="/auth/login">ログイン</Link>
        </Button>
      </div>
    </div>
  )
}
