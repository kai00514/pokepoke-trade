import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"

export default function AuthCodeErrorPage() {
  return (
    <div className="text-center">
      <div className="mb-6">
        <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-slate-800 mb-2">認証エラー</h1>
        <p className="text-sm text-slate-500">
          認証プロセスでエラーが発生しました。
          <br />
          もう一度お試しください。
        </p>
      </div>

      <div className="space-y-3">
        <Button asChild className="w-full bg-purple-500 hover:bg-purple-600 text-white">
          <Link href="/auth/login">ログインページに戻る</Link>
        </Button>
        <Button asChild variant="outline" className="w-full">
          <Link href="/">ホームページに戻る</Link>
        </Button>
      </div>
    </div>
  )
}
