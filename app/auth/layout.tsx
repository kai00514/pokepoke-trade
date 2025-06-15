import type React from "react"
import AuthHeader from "@/components/auth-header"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full flex flex-col bg-gradient-to-br from-purple-50 to-purple-100">
      <AuthHeader />
      <div className="flex-grow flex items-center justify-center p-4">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  )
}
