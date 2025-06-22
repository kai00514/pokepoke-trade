"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Mail, Lock, Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react"
import { GoogleIcon } from "@/components/icons/google-icon"
import { LineIcon } from "@/components/icons/line-icon"
import { createBrowserClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const [isResettingPassword, setIsResettingPassword] = useState(false)
  const [resetEmail, setResetEmail] = useState("")
  const [showResetForm, setShowResetForm] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  const { toast } = useToast()
  const router = useRouter()
  const supabase = createBrowserClient()

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true)
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
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

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setIsLoading(true)
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

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setIsResettingPassword(true)

      const currentDomain = window.location.origin
      // URLをエンコードして確実に渡す
      const redirectUrl = encodeURIComponent(`${currentDomain}/auth/reset`)

      console.log("DEBUG: Sending password reset email with redirectTo (encoded):", redirectUrl)

      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${currentDomain}/auth/reset`, // ここはエンコードしない生のURLを渡す
      })

      if (error) {
        console.error("DEBUG: Password reset error:", error)
        toast({
          title: "エラー",
          description: error.message,
          variant: "destructive",
        })
      } else {
        console.log("DEBUG: Password reset email sent successfully")
        setShowResetForm(false)
        setShowSuccessModal(true)
        setResetEmail("")
      }
    } catch (error) {
      console.error("DEBUG: Password reset exception:", error)
      toast({
        title: "エラー",
        description: "予期しないエラーが発生しました。",
        variant: "destructive",
      })
    } finally {
      setIsResettingPassword(false)
    }
  }

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get("reset") === "success") {
      toast({
        title: "パスワード更新完了",
        description: "パスワードが正常に更新されました。新しいパスワードでログインしてください。",
      })
    }
  }, [toast])

  return (
    <div className="text-center">
      <h1 className="text-2xl font-bold text-slate-800 mb-8">ログイン</h1>

      <form onSubmit={handleEmailLogin} className="space-y-4 text-left">
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
          <div className="flex justify-between items-baseline">
            <label className="text-sm font-medium text-slate-700">パスワード</label>
            <Link
              href="#"
              className="text-xs text-purple-600 hover:underline"
              onClick={(e) => {
                e.preventDefault()
                setShowResetForm(true)
              }}
            >
              パスワードを忘れた方はこちら
            </Link>
          </div>
          <div className="relative mt-1">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              type={passwordVisible ? "text" : "password"}
              placeholder="あなたのパスワード"
              className="pl-10 pr-10 h-12"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setPasswordVisible(!passwordVisible)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label={passwordVisible ? "パスワードを非表示" : "パスワードを表示"}
            >
              {passwordVisible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>
        <Button
          type="submit"
          className="w-full bg-purple-500 hover:bg-purple-600 text-white h-12 text-base"
          disabled={isLoading}
        >
          {isLoading ? "ログイン中..." : "ログインする"}
        </Button>
      </form>

      {/* パスワードリセットフォーム */}
      {showResetForm && (
        <div className="mt-6 p-4 border rounded-lg bg-purple-50">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">パスワードリセット</h3>
          <form onSubmit={handlePasswordReset} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">メールアドレス</label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  type="email"
                  placeholder="登録済みのメールアドレス"
                  className="pl-10 h-12"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                type="submit"
                className="flex-1 bg-purple-500 hover:bg-purple-600 text-white h-12"
                disabled={isResettingPassword}
              >
                {isResettingPassword ? "送信中..." : "リセットリンクを送信"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-12"
                onClick={() => {
                  setShowResetForm(false)
                  setResetEmail("")
                }}
              >
                キャンセル
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* 成功モーダル */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-green-100 rounded-full">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <DialogTitle className="text-center text-xl font-semibold text-slate-800">メール送信完了</DialogTitle>
          </DialogHeader>
          <div className="text-center space-y-4">
            <p className="text-slate-600">
              パスワードリセット用のリンクを
              <br />
              <span className="font-semibold text-purple-600">{resetEmail}</span>
              <br />
              に送信しました。
            </p>
            <div className="bg-blue-50 p-4 rounded-lg text-left">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-1">次の手順:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>メールボックスを確認してください</li>
                    <li>「パスワードをリセットする」ボタンをクリック</li>
                    <li>新しいパスワードを設定してください</li>
                  </ol>
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-500">
              ※メールが届かない場合は、迷惑メールフォルダもご確認ください。
              <br />
              ※リンクの有効期限は24時間です。
            </p>
            <Button
              onClick={() => setShowSuccessModal(false)}
              className="w-full bg-purple-500 hover:bg-purple-600 text-white"
            >
              確認しました
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-[#f8f7fa] px-2 text-slate-500">または</span>
        </div>
      </div>

      <div className="space-y-3">
        <Button
          variant="outline"
          className="w-full justify-center items-center p-6 bg-white"
          onClick={handleGoogleLogin}
          disabled={isLoading}
        >
          <GoogleIcon className="h-5 w-5 mr-3" />
          <span className="font-semibold text-slate-700">Googleでログイン</span>
        </Button>
        <Button variant="outline" className="w-full justify-center items-center p-6 bg-white" disabled>
          <LineIcon className="h-5 w-5 mr-3" />
          <span className="font-semibold text-slate-400">LINEでログイン（準備中）</span>
        </Button>
      </div>

      <p className="text-xs text-slate-500 mt-8">※ソーシャルログイン機能は現在ブラウザのみで提供しています。</p>

      <div className="mt-8">
        <p className="text-sm text-slate-600 mb-3">アカウントをお持ちでない方</p>
        <Button
          asChild
          variant="outline"
          className="w-full border-purple-600 text-purple-600 bg-white hover:bg-purple-50 hover:text-purple-700 p-6"
        >
          <Link href="/auth/signup">新規会員登録</Link>
        </Button>
      </div>
    </div>
  )
}
