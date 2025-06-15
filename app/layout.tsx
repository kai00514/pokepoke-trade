import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google" // 日本語フォントを推奨 (例: Noto Sans JP)
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/contexts/auth-context"

const inter = Inter({ subsets: ["latin"] }) // Noto Sans JPなどに変更推奨

export const metadata: Metadata = {
  title: "ポケリンクトレード掲示板",
  description: "ポケットポケットのカードをトレードしましょう！",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className={`${inter.className} bg-gradient-to-br from-purple-50 to-purple-100 min-h-screen`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
