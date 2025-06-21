import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/contexts/auth-context"

const inter = Inter({ subsets: ["latin"] })

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
  console.log("🏗️ RootLayout rendering")
  console.log("🔍 Children type:", typeof children)
  console.log("🔍 Children:", children)

  return (
    <html lang="ja" suppressHydrationWarning>
      <body className={`${inter.className} bg-gradient-to-br from-purple-50 to-purple-100 min-h-screen`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <AuthProvider>
            {console.log("🔄 About to render children in AuthProvider")}
            <div id="layout-debug" style={{ border: "2px solid red", margin: "10px", padding: "10px" }}>
              <p style={{ color: "red", fontWeight: "bold" }}>DEBUG: Layout.tsx children wrapper</p>
              {children}
            </div>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
