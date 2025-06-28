"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface PokepokeIdRegistrationModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  currentPokepokeId?: string | null
  onSave: (pokepokeId: string) => void
}

export function PokepokeIdRegistrationModal({
  isOpen,
  onOpenChange,
  currentPokepokeId,
  onSave,
}: PokepokeIdRegistrationModalProps) {
  const [pokepokeId, setPokepokeId] = useState(currentPokepokeId || "")
  const [isLoading, setIsLoading] = useState(false)

  const handleSave = async () => {
    if (!pokepokeId.trim()) {
      return
    }

    setIsLoading(true)
    try {
      await onSave(pokepokeId.trim())
    } catch (error) {
      console.error("Error saving pokepoke ID:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (!isLoading) {
      onOpenChange(open)
      if (!open) {
        // モーダルが閉じられる時に現在の値にリセット
        setPokepokeId(currentPokepokeId || "")
      }
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>ポケポケID登録</DialogTitle>
          <DialogDescription>
            あなたのポケポケIDを入力してください。トレード投稿時に自動入力されます。
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="pokepokeId" className="text-right">
              ポケポケID
            </Label>
            <Input
              id="pokepokeId"
              value={pokepokeId}
              onChange={(e) => setPokepokeId(e.target.value)}
              className="col-span-3"
              placeholder="例: POKE12345"
              disabled={isLoading}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isLoading}>
            キャンセル
          </Button>
          <Button type="submit" onClick={handleSave} disabled={isLoading || !pokepokeId.trim()}>
            {isLoading ? "保存中..." : "保存"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
