"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

interface LoginPromptProps {
  open: boolean
  setOpen: (open: boolean) => void
  title?: string
  description?: string
  onContinueAsGuest?: () => void
}

export function LoginPrompt({
  open,
  setOpen,
  title = "ログインが必要です",
  description = "この機能を使用するにはログインしてください。",
  onContinueAsGuest,
}: LoginPromptProps) {
  const router = useRouter()

  const handleLogin = () => {
    setOpen(false)
    router.push("/auth/login")
  }

  const handleSignup = () => {
    setOpen(false)
    router.push("/auth/signup")
  }

  const handleContinueAsGuest = () => {
    setOpen(false)
    if (onContinueAsGuest) {
      onContinueAsGuest()
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 mt-4">
          <Button onClick={handleLogin} className="w-full">
            ログイン
          </Button>
          <Button onClick={handleSignup} variant="outline" className="w-full">
            新規登録
          </Button>
          <Button onClick={handleContinueAsGuest} variant="ghost" className="w-full">
            ゲストとして続ける
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
