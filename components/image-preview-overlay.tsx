"use client"

import Image from "next/image"
import { X } from "lucide-react"
import { useEffect } from "react"

interface ImagePreviewOverlayProps {
  isOpen: boolean
  imageUrl: string | null
  cardName?: string // Optional: for alt text
  onClose: () => void
}

export default function ImagePreviewOverlay({
  isOpen,
  imageUrl,
  cardName = "Card Preview",
  onClose,
}: ImagePreviewOverlayProps) {
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen || !imageUrl) return null

  return (
    <div
      className="fixed inset-0 bg-black/85 flex items-center justify-center z-[9999] p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="image-preview-title"
    >
      <div
        className="relative w-auto h-auto max-w-[90vw] max-h-[90vh]"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking image container
      >
        {/* Invisible title for accessibility */}
        <h2 id="image-preview-title" className="sr-only">
          {cardName} - Image Preview
        </h2>
        <Image
          src={imageUrl || "/placeholder.svg"}
          alt={cardName}
          width={600} // Base width, will scale down with CSS if needed
          height={840} // Base height, maintaining aspect ratio
          className="object-contain rounded-lg shadow-2xl"
          style={{ width: "auto", height: "auto", maxWidth: "100%", maxHeight: "100%" }}
          unoptimized // Useful if image dimensions vary greatly or are external
        />
        <button
          onClick={onClose}
          className="absolute -top-2 -right-2 sm:top-2 sm:right-2 bg-slate-800/70 hover:bg-slate-700/90 text-white rounded-full p-1.5 shadow-lg transition-colors"
          aria-label="Close image preview"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
