"use client"

import { useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { LogIn, UserPlus } from "lucide-react"

type LoginPromptModalProps = {
  onClose: () => void
  onContinueAsGuest: () => void
}

export default function LoginPromptModal({ onClose, onContinueAsGuest }: LoginPromptModalProps) {
  const router = useRouter()
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [onClose])

  const handleLogin = () => {
    router.push("/login")
  }

  const handleRegister = () => {
    router.push("/register")
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div ref={modalRef} className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold mb-4">アカウント登録のご案内</h2>
        <p className="text-gray-600 mb-6">
          ログインするとコメントの管理や通知の受け取りがより便利になります。アカウントをお持ちでない方は新規登録も簡単です。
        </p>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <button
            onClick={handleLogin}
            className="bg-[#6246ea] text-white rounded-lg py-3 text-center font-medium hover:bg-opacity-90 transition-colors flex items-center justify-center"
          >
            <LogIn size={18} className="mr-2" />
            ログイン
          </button>
          <button
            onClick={handleRegister}
            className="bg-[#e45858] text-white rounded-lg py-3 text-center font-medium hover:bg-opacity-90 transition-colors flex items-center justify-center"
          >
            <UserPlus size={18} className="mr-2" />
            新規登録
          </button>
        </div>
        <button
          onClick={onContinueAsGuest}
          className="w-full border border-gray-300 rounded-lg py-3 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
        >
          ゲストとして続ける
        </button>
      </div>
    </div>
  )
}
