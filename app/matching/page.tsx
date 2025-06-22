import Header from "@/components/layout/header"
import Footer from "@/components/footer"
import { Card, CardContent } from "@/components/ui/card"
import { Construction, CalendarClock } from "lucide-react"
import Link from "next/link"

export default function MatchingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-12 flex flex-col items-center justify-center text-center">
        <h1 className="text-3xl font-bold text-slate-800 mb-8">マッチング</h1>
        <Card className="w-full max-w-md p-8 shadow-lg">
          <CardContent className="flex flex-col items-center gap-6 p-0">
            <div className="bg-violet-100 p-4 rounded-full">
              <Construction className="h-12 w-12 text-violet-500" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-slate-900">Coming Soon</h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                マッチング機能は現在開発中です。
                <br />
                より良い体験をご提供するために準備を進めています。
              </p>
            </div>
            <Link
              href="#"
              className="inline-flex items-center text-sm font-medium text-violet-600 hover:text-violet-800 transition-colors"
            >
              <CalendarClock className="mr-2 h-4 w-4" />
              近日公開予定
            </Link>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  )
}
