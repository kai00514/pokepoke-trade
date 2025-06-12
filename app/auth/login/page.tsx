"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Mail, Lock, Eye, EyeOff } from "lucide-react"
import { GoogleIcon } from "@/components/icons/google-icon"
import { LineIcon } from "@/components/icons/line-icon"

export default function LoginPage() {
  const [passwordVisible, setPasswordVisible] = useState(false)

  return (
    <div className="text-center">
      <h1 className="text-2xl font-bold text-slate-800 mb-8">ログイン</h1>

      <form className="space-y-4 text-left">
        <div>
          <label className="text-sm font-medium text-slate-700">メールアドレス</label>
          <div className="relative mt-1">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input type="email" placeholder="あなたのメールアドレス" className="pl-10 h-12" />
          </div>
        </div>
        <div>
          <div className="flex justify-between items-baseline">
            <label className="text-sm font-medium text-slate-700">パスワード</label>
            <Link href="#" className="text-xs text-purple-600 hover:underline">
              パスワードを忘れた方はこちら
            </Link>
          </div>
          <div className="relative mt-1">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              type={passwordVisible ? "text" : "password"}
              placeholder="あなたのパスワード"
              className="pl-10 pr-10 h-12"
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
        <Button type="submit" className="w-full bg-purple-500 hover:bg-purple-600 text-white h-12 text-base">
          ログインする
        </Button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-[#f8f7fa] px-2 text-slate-500">または</span>
        </div>
      </div>

      <div className="space-y-3">
        <Button variant="outline" className="w-full justify-center items-center p-6 bg-white">
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
