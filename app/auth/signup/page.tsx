import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Mail } from "lucide-react"
import { GoogleIcon } from "@/components/icons/google-icon"
import { LineIcon } from "@/components/icons/line-icon"

export default function SignUpPage() {
  return (
    <div className="text-center">
      <h1 className="text-2xl font-bold text-slate-800 mb-2">会員登録</h1>
      <p className="text-sm text-slate-500 mb-8">アカウントを作成してポケモンカードの取引を始めましょう</p>

      <div className="space-y-3">
        <Button variant="outline" className="w-full justify-between items-center p-6 bg-white">
          <div className="flex items-center">
            <Mail className="h-5 w-5 mr-3 text-purple-500" />
            <span className="font-semibold text-slate-700">メールアドレスで新規登録</span>
          </div>
          <span className="text-slate-400">→</span>
        </Button>
        <Button variant="outline" className="w-full justify-between items-center p-6 bg-white">
          <div className="flex items-center">
            <GoogleIcon className="h-5 w-5 mr-3" />
            <span className="font-semibold text-slate-700">Googleで登録</span>
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
