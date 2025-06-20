"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"

interface LoginPromptModalProps {
  onClose: () => void
  onContinueAsGuest?: () => void
  showContinueAsGuest?: boolean
}

export default function LoginPromptModal({
  onClose,
  onContinueAsGuest,
  showContinueAsGuest = true,
}: LoginPromptModalProps) {
  const handleContinueAsGuest = () => {
    if (onContinueAsGuest) {
      onContinueAsGuest()
    }
    onClose()
  }

  return (
    <AlertDialog open onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>ログインが必要です</AlertDialogTitle>
          <AlertDialogDescription>この操作を実行するにはログインしてください。</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>キャンセル</AlertDialogCancel>
          {showContinueAsGuest && (
            <Button onClick={handleContinueAsGuest} variant="ghost" className="w-full">
              ログインせずに続ける
            </Button>
          )}
          <AlertDialogAction>ログイン</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
