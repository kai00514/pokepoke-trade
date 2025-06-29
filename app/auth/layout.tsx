"use client"

import type React from "react"
import Header from "@/components/header"
import { Suspense } from "react" // Suspenseをインポート

interface AuthLayoutProps {
  children: React.ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen w-full flex flex-col bg-gradient-to-br from-purple-50 to-purple-100">
      <Header />
      <div className="flex-grow flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Suspense fallback={<div>認証ページを読み込み中...</div>}>{children}</Suspense>
        </div>
      </div>
    </div>
  )
}
