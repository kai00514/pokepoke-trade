"use client"

import { useMemo } from "react"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import type { Card } from "@/components/detailed-search-modal"

type DeckCard = Card & { quantity: number }

interface DeckCompositionChartProps {
  cards: DeckCard[]
}

const COLORS = {
  pokemon: "#81C784", // Green
  trainer: "#64B5F6", // Blue
  energy: "#FFD54F", // Amber
}

export default function DeckCompositionChart({ cards }: DeckCompositionChartProps) {
  const data = useMemo(() => {
    const composition = {
      pokemon: 0,
      trainer: 0,
      energy: 0,
    }

    cards.forEach((card) => {
      const category = card.category || "goods"
      if (category === "pokemon") {
        composition.pokemon += card.quantity
      } else if (category === "energy") {
        composition.energy += card.quantity
      } else {
        // Group all non-pokemon/energy cards as 'trainer' for simplicity
        composition.trainer += card.quantity
      }
    })

    return [
      { name: "ポケモン", value: composition.pokemon, color: COLORS.pokemon },
      { name: "トレーナーズ", value: composition.trainer, color: COLORS.trainer },
      { name: "エネルギー", value: composition.energy, color: COLORS.energy },
    ].filter((entry) => entry.value > 0)
  }, [cards])

  if (data.length === 0) {
    return <div className="text-center text-sm text-slate-500 py-8">デッキにカードがありません。</div>
  }

  return (
    <div style={{ width: "100%", height: 250 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            innerRadius={50} // This makes it a donut chart
            fill="#8884d8"
            dataKey="value"
            stroke="var(--background)"
            strokeWidth={2}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--background))",
              borderColor: "hsl(var(--border))",
              borderRadius: "var(--radius)",
            }}
            formatter={(value: number, name: string) => [`${value}枚`, name]}
          />
          <Legend
            iconType="circle"
            formatter={(value, entry) => (
              <span className="text-slate-700 dark:text-slate-300 ml-2">
                {value} ({entry.payload?.value}枚)
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
