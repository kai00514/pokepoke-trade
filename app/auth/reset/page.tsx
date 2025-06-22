"use client"

import type React from "react"
import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Lock, Eye, EyeOff, CheckCircle } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"

function ResetPasswordContent() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSessionReady, setIsSessionReady] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)

  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createBrowserClient()

  useEffect(() => {
    const handlePasswordReset = async () => {
      try {
        setIsInitializing(true)

        // URLパラメータからcodeを取得
        const code = searchParams.get("code")
        console.log("Reset code:", code) // デバッグ用

        if (!code) {
          toast({
            title: "無効なアクセス",
            description: "正しいリンクからアクセスしてください。",
            variant: "destructive",
          })
          router.push("/auth/login")
          return
        }

        // コードをセッションに交換
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)
        console.log("Exchange result:", { data, error }) // デバッグ用

        if (error) {
          console.error("Exchange error:", error)
          toast({
            title: "認証エラー",
            description: "無効なリンクまたは期限切れです。再度パスワードリセットを行ってください。",
            variant: "destructive",
          })
          router.push("/auth/login")
          return
        }

        if (data?.session) {
          setIsSessionReady(true)
          toast({
            title: "認証成功",
            description: "新しいパスワードを設定してください。",
          })
        } else {
          toast({
            title: "セッションエラー",
            description: "認証に失敗しました。再度お試しください。",
            variant: "destructive",
          })
          router.push("/auth/login")
        }
      } catch (error) {
        console.error("Reset initialization error:", error)
        toast({
          title: "エラー",
          description: "予期しないエラーが発生しました。",
          variant: "destructive",
        })
        router.push("/auth/login")
      } finally {
        setIsInitializing(false)
      }
    }

    handlePasswordReset()
  }, [searchParams, supabase.auth, toast, router])

  const handlePasswordUpdate = async (e: React.FormEvent) => {
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

      // 現在のセッションを確認
      const {
        data: { session },
      } = await supabase.auth.getSession()
      console.log("Current session:", session) // デバッグ用

      if (!session) {
        toast({
          title: "セッションエラー",
          description: "セッションが無効です。再度リセットリンクからアクセスしてください。",
          variant: "destructive",
        })
        router.push("/auth/login")
        return
      }

      // パスワードを更新
      const { data, error } = await supabase.auth.updateUser({
        password: password,
      })
      console.log("Update result:", { data, error }) // デバッグ用

      if (error) {
        console.error("Password update error:", error)
        toast({
          title: "パスワード更新エラー",
          description: error.message,
          variant: "destructive",
        })
      } else {
        toast({
          title: "パスワード更新完了",
          description: "パスワードが正常に更新されました。",
        })

        // 成功のポップアップ表示
        alert("パスワードが正常に更新されました！\n\n新しいパスワードでログインしてください。")

        // ログアウトしてからログインページにリダイレクト
        await supabase.auth.signOut()
        router.push("/auth/login?reset=success")
      }
    } catch (error) {
      console.error("Password update error:", error)
      toast({
        title: "エラー",
        description: "予期しないエラーが発生しました。",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isInitializing) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-800 mb-8">認証中...</h1>
        <div className="flex justify-center items-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
          <p className="text-slate-600">リンクを確認しています。しばらくお待ちください。</p>
        </div>
      </div>
    )
  }

  if (!isSessionReady) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-800 mb-8">認証に失敗しました</h1>
        <p className="text-slate-600 mb-4">リンクが無効または期限切れです。</p>
        <Button onClick={() => router.push("/auth/login")} className="bg-purple-500 hover:bg-purple-600 text-white">
          ログインページに戻る
        </Button>
      </div>
    )
  }

  return (
    <div className="text-center">
      <div className="flex justify-center mb-4">
        <CheckCircle className="h-12 w-12 text-green-500" />
      </div>
      <h1 className="text-2xl font-bold text-slate-800 mb-2">新しいパスワードを設定</h1>
      <p className="text-sm text-slate-500 mb-8">新しいパスワードを入力してください</p>

      <form onSubmit={handlePasswordUpdate} className="space-y-4 text-left">
        <div>
          <label className="text-sm font-medium text-slate-700">新しいパスワード</label>
          <div className="relative mt-1">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              type={passwordVisible ? "text" : "password"}
              placeholder="新しいパスワード（6文字以上）"
              className="pl-10 pr-10 h-12"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
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
              minLength={6}
            />
            <button
              type="button"
              onClick={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label={confirmPasswordVisible ? "パスワードを非表示" : "パスワードを表示"}
            >
              {confirmPasswordVisible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* パスワード強度インジケーター */}
        {password && (
          <div className="text-xs text-slate-500">
            <div className="flex items-center space-x-2">
              <div className={`h-1 w-full rounded ${password.length >= 6 ? "bg-green-500" : "bg-red-500"}`}></div>
            </div>
            <p className="mt-1">
              {password.length >= 6 ? "✓ パスワードの長さが適切です" : "× パスワードは6文字以上で入力してください"}
            </p>
            {password && confirmPassword && password !== confirmPassword && (
              <p className="text-red-500">× パスワードが一致しません</p>
            )}
            {password && confirmPassword && password === confirmPassword && (
              <p className="text-green-500">✓ パスワードが一致しています</p>
            )}
          </div>
        )}

        <Button
          type="submit"
          className="w-full bg-purple-500 hover:bg-purple-600 text-white h-12 text-base"
          disabled={isLoading || password !== confirmPassword || password.length < 6}
        >
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>更新中...</span>
            </div>
          ) : (
            "パスワードを更新"
          )}
        </Button>
      </form>

      <div className="mt-8">
        <Button
          variant="ghost"
          onClick={() => router.push("/auth/login")}
          className="text-purple-600 hover:text-purple-700"
        >
          ← ログインページに戻る
        </Button>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-800 mb-8">読み込み中...</h1>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto"></div>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  )
}
