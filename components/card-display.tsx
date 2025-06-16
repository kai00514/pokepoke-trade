"use client"

import type React from "react"

import Image from "next/image"
import { useEffect, useState } from "react"
import { fetchCardById } from "@/lib/card-api" // API関数をインポート

interface CardDisplayProps {
  cardId: number | string
  useThumb?: boolean
  width?: number // オプショナルに変更
  height?: number // オプショナルに変更
  className?: string
  fill?: boolean // fillプロパティを追加
  objectFit?: "contain" | "cover" | "fill" | "none" | "scale-down" // objectFitプロパティを追加
}

const CardDisplay: React.FC<CardDisplayProps> = ({
  cardId,
  useThumb = true,
  width,
  height,
  className,
  fill = false, // デフォルトはfalse
  objectFit = "contain", // デフォルトはcontain
}) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const getImageUrl = async () => {
      setLoading(true)
      setError(null)
      try {
        // fetchCardImageById を fetchCardById に変更
        const cardData = await fetchCardById(String(cardId)) // String(cardId) を渡す
        if (cardData) {
          const url = useThumb ? cardData.thumb_url || cardData.image_url : cardData.image_url
          if (url) {
            setImageUrl(url)
          } else {
            setError("画像が見つかりません")
            setImageUrl(`/placeholder.svg?width=${width || 100}&height=${height || 140}&query=card-${cardId}`)
          }
        } else {
          setError("カードデータが見つかりません")
          setImageUrl(`/placeholder.svg?width=${width || 100}&height=${height || 140}&query=card-${cardId}-nodata`)
        }
      } catch (err) {
        console.error(`Error fetching image for card ${cardId}:`, err)
        setError("画像の読み込みに失敗しました")
        setImageUrl(`/placeholder.svg?width=${width || 100}&height=${height || 140}&query=card-${cardId}-error`)
      } finally {
        setLoading(false)
      }
    }

    if (cardId) {
      // cardIdが存在する場合のみ実行
      getImageUrl()
    } else {
      setLoading(false)
      setError("カードIDがありません")
      setImageUrl(`/placeholder.svg?width=${width || 100}&height=${height || 140}&query=no-card-id`)
    }
  }, [cardId, useThumb, width, height]) // widthとheightを依存配列に追加

  if (loading) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-200 rounded-md animate-pulse ${className || ""}`}
        style={fill ? { width: "100%", height: "100%" } : { width: `${width || 100}px`, height: `${height || 140}px` }}
      >
        {/* ローディング中のプレースホルダーの高さを指定 */}
      </div>
    )
  }

  if (error || !imageUrl) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-300 rounded-md text-white text-xs p-2 ${className || ""}`}
        style={fill ? { width: "100%", height: "100%" } : { width: `${width || 100}px`, height: `${height || 140}px` }}
      >
        {error || "画像なし"}
      </div>
    )
  }

  if (fill) {
    return (
      <div className={`relative w-full h-full ${className || ""}`}>
        <Image
          src={imageUrl || "/placeholder.svg"}
          alt={`Card ${cardId}`}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" // レスポンシブなsizes属性
          className={`object-${objectFit} rounded-md`} // objectFitを適用
          priority={false} // 必要に応じて調整
          unoptimized={imageUrl.includes("tcg-collector-production.s3.amazonaws.com")} // S3画像は最適化しない
        />
      </div>
    )
  }

  return (
    <Image
      src={imageUrl || "/placeholder.svg"}
      alt={`Card ${cardId}`}
      width={width || 100} // デフォルト値を設定
      height={height || 140} // デフォルト値を設定
      className={`rounded-md ${className || ""}`}
      priority={false} // 必要に応じて調整
      unoptimized={imageUrl.includes("tcg-collector-production.s3.amazonaws.com")} // S3画像は最適化しない
    />
  )
}

export default CardDisplay
