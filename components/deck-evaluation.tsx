"use client"

import { TrendingUp } from "lucide-react"
import { useEffect, useRef } from "react"
import type { DeckStats, TierInfo } from "@/types/deck"

interface DeckEvaluationProps {
  evaluationTitle: string
  tierInfo: TierInfo
  deckStats: DeckStats
}

export function DeckEvaluation({ evaluationTitle, tierInfo, deckStats }: DeckEvaluationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const getTierColor = (rank: string) => {
    switch (rank) {
      case "SS":
        return "bg-red-600"
      case "S":
        return "bg-orange-500"
      case "A":
        return "bg-yellow-500"
      case "B":
        return "bg-green-500"
      case "C":
        return "bg-blue-500"
      default:
        return "bg-gray-500"
    }
  }

  const statsArray = [
    { label: "集めやすさ", value: deckStats.accessibility, max: 5 },
    { label: "速度", value: deckStats.speed, max: 5 },
    { label: "火力", value: deckStats.power, max: 5 },
    { label: "耐久", value: deckStats.durability, max: 5 },
    { label: "安定", value: deckStats.stability, max: 5 },
  ]

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const radius = Math.min(centerX, centerY) - 40

    // キャンバスをクリア
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // レーダーチャートの背景グリッドを描画
    ctx.strokeStyle = "#e5e7eb"
    ctx.lineWidth = 1

    // 同心円を描画
    for (let i = 1; i <= 5; i++) {
      ctx.beginPath()
      ctx.arc(centerX, centerY, (radius * i) / 5, 0, 2 * Math.PI)
      ctx.stroke()
    }

    // 軸線を描画
    const angleStep = (2 * Math.PI) / statsArray.length
    for (let i = 0; i < statsArray.length; i++) {
      const angle = i * angleStep - Math.PI / 2
      const x = centerX + Math.cos(angle) * radius
      const y = centerY + Math.sin(angle) * radius

      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.lineTo(x, y)
      ctx.stroke()
    }

    // データポイントを描画
    ctx.fillStyle = "rgba(59, 130, 246, 0.3)"
    ctx.strokeStyle = "#3b82f6"
    ctx.lineWidth = 2

    ctx.beginPath()
    for (let i = 0; i < statsArray.length; i++) {
      const angle = i * angleStep - Math.PI / 2
      const value = statsArray[i].value / statsArray[i].max
      const x = centerX + Math.cos(angle) * radius * value
      const y = centerY + Math.sin(angle) * radius * value

      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    }
    ctx.closePath()
    ctx.fill()
    ctx.stroke()

    // データポイントの点を描画
    ctx.fillStyle = "#3b82f6"
    for (let i = 0; i < statsArray.length; i++) {
      const angle = i * angleStep - Math.PI / 2
      const value = statsArray[i].value / statsArray[i].max
      const x = centerX + Math.cos(angle) * radius * value
      const y = centerY + Math.sin(angle) * radius * value

      ctx.beginPath()
      ctx.arc(x, y, 4, 0, 2 * Math.PI)
      ctx.fill()
    }

    // ラベルを描画
    ctx.fillStyle = "#374151"
    ctx.font = "12px sans-serif"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"

    for (let i = 0; i < statsArray.length; i++) {
      const angle = i * angleStep - Math.PI / 2
      const labelRadius = radius + 20
      const x = centerX + Math.cos(angle) * labelRadius
      const y = centerY + Math.sin(angle) * labelRadius

      ctx.fillText(statsArray[i].label, x, y)
    }
  }, [deckStats])

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4 text-blue-600 border-l-4 border-blue-500 pl-3">{evaluationTitle}</h3>

      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-3">
          <div className={`${getTierColor(tierInfo.rank)} text-white px-3 py-1 rounded font-bold text-lg`}>
            {tierInfo.rank}
          </div>
          <div className="text-sm">
            <div>{tierInfo.tier}</div>
            <ul className="text-xs text-gray-600 mt-1">
              {tierInfo.descriptions.map((desc, index) => (
                <li key={index}>・{desc}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h4 className="font-medium mb-4 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-blue-500" />
          デッキ特徴
        </h4>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* レーダーチャート */}
          <div className="flex justify-center">
            <canvas ref={canvasRef} width={300} height={300} className="max-w-full h-auto" />
          </div>

          {/* 数値表示 */}
          <div className="space-y-4">
            {statsArray.map((stat) => (
              <div key={stat.label} className="flex items-center gap-4">
                <div className="w-20 text-sm">{stat.label}</div>
                <div className="flex gap-1 flex-1">
                  {Array.from({ length: stat.max }).map((_, i) => (
                    <div key={i} className={`h-6 flex-1 rounded ${i < stat.value ? "bg-blue-500" : "bg-gray-200"}`} />
                  ))}
                </div>
                <div className="text-sm text-gray-600 w-8">
                  {stat.value}/{stat.max}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
