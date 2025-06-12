"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ArrowLeft, ChevronDown, ChevronUp, Trash2, Save } from "lucide-react"
import { cn } from "@/lib/utils"
import DetailedSearchModal from "@/components/detailed-search-modal"
import DeckCompositionChart from "@/components/deck-composition-chart"
import DeckCardItem from "@/components/deck-card-item"
import type { Card as CardType } from "@/components/detailed-search-modal"

type DeckCard = CardType & { quantity: number }

const energyTypes = [
  { name: "草", icon: "/images/types/草.png", id: "grass", color: "bg-green-500" },
  { name: "炎", icon: "/images/types/炎.png", id: "fire", color: "bg-red-500" },
  { name: "水", icon: "/images/types/水.png", id: "water", color: "bg-blue-500" },
  { name: "電気", icon: "/images/types/電気.png", id: "electric", color: "bg-yellow-500" },
  { name: "エスパー", icon: "/images/types/エスパー.png", id: "psychic", color: "bg-purple-500" },
  { name: "格闘", icon: "/images/types/格闘.png", id: "fighting", color: "bg-orange-500" },
  { name: "悪", icon: "/images/types/悪.png", id: "dark", color: "bg-gray-800" },
  { name: "鋼", icon: "/images/types/鋼.png", id: "metal", color: "bg-gray-500" },
  { name: "無色", icon: "/images/types/無色.png", id: "colorless", color: "bg-gray-400" },
  { name: "ドラゴン", icon: "/images/types/ドラゴン.png", id: "dragon", color: "bg-yellow-600" },
]

const cardCategories = ["全て", "ポケモン", "トレーナーズ", "グッズ", "どうぐ"]

export default function CreateDeckPage() {
  const [deckName, setDeckName] = useState("")
  const [deckDescription, setDeckDescription] = useState("")
  const [selectedEnergyTypes, setSelectedEnergyTypes] = useState<string[]>([])
  const [deckCards, setDeckCards] = useState<DeckCard[]>([])
  const [isPublic, setIsPublic] = useState(true)
  const [clearAll, setClearAll] = useState(false)

  // Mobile layout state
  const [isDeckInfoExpanded, setIsDeckInfoExpanded] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState("全て")

  const totalCards = deckCards.reduce((sum, card) => sum + card.quantity, 0)
  const maxCards = 20

  const toggleEnergyType = (typeId: string) => {
    setSelectedEnergyTypes((prev) => (prev.includes(typeId) ? prev.filter((id) => id !== typeId) : [...prev, typeId]))
  }

  const handleCardSelectionComplete = useCallback((selectedCards: CardType[]) => {
    selectedCards.forEach((card) => {
      setDeckCards((prev) => {
        const existingCard = prev.find((dc) => dc.id === card.id)
        if (existingCard) {
          return prev.map((dc) => (dc.id === card.id ? { ...dc, quantity: Math.min(dc.quantity + 1, 4) } : dc))
        } else {
          return [...prev, { ...card, quantity: 1 }]
        }
      })
    })
  }, [])

  const handleQuantityChange = useCallback((cardId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setDeckCards((prev) => prev.filter((card) => card.id !== cardId))
    } else {
      setDeckCards((prev) => prev.map((card) => (card.id === cardId ? { ...card, quantity: newQuantity } : card)))
    }
  }, [])

  const handleRemoveCard = useCallback((cardId: string) => {
    setDeckCards((prev) => prev.filter((card) => card.id !== cardId))
  }, [])

  const handleSave = () => {
    // Implement save functionality
    console.log("Saving deck:", { deckName, deckDescription, selectedEnergyTypes, deckCards, isPublic })
  }

  const renderDeckSlots = () => {
    const slots = Array.from({ length: maxCards }, (_, i) => i + 1)
    return (
      <div className="grid grid-cols-10 gap-1 sm:gap-2">
        {slots.map((slot) => (
          <div
            key={slot}
            className={cn(
              "aspect-square flex items-center justify-center text-xs sm:text-sm font-medium rounded border-2",
              slot <= totalCards
                ? "bg-purple-100 border-purple-300 text-purple-700"
                : "bg-gray-100 border-gray-300 text-gray-500",
            )}
          >
            {slot}
          </div>
        ))}
      </div>
    )
  }

  const renderDeckInfo = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">デッキ名</label>
        <Input
          value={deckName}
          onChange={(e) => setDeckName(e.target.value)}
          placeholder="デッキ名を入力"
          className="w-full"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">デッキ説明 (任意)</label>
        <Textarea
          value={deckDescription}
          onChange={(e) => setDeckDescription(e.target.value)}
          placeholder="デッキの説明を入力"
          rows={3}
          className="w-full resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">主要エネルギータイプ</label>
        <div className="flex flex-wrap gap-2">
          {energyTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => toggleEnergyType(type.id)}
              className={cn(
                "p-2 rounded-full border-2 transition-all",
                selectedEnergyTypes.includes(type.id)
                  ? "border-purple-500 ring-2 ring-purple-200"
                  : "border-gray-300 hover:border-gray-400",
              )}
            >
              <Image src={type.icon || "/placeholder.svg"} alt={type.name} width={24} height={24} className="w-6 h-6" />
            </button>
          ))}
        </div>
      </div>
    </div>
  )

  const renderDeckComposition = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-800">
          デッキ ({totalCards}/{maxCards})
        </h3>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setClearAll(!clearAll)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            すべて外す
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">公開</span>
            <button
              onClick={() => setIsPublic(!isPublic)}
              className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                isPublic ? "bg-purple-600" : "bg-gray-300",
              )}
            >
              <span
                className={cn(
                  "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                  isPublic ? "translate-x-6" : "translate-x-1",
                )}
              />
            </button>
          </div>
        </div>
      </div>

      {renderDeckSlots()}

      {deckCards.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-slate-700">デッキリスト</h4>
          <ScrollArea className="h-48">
            <div className="space-y-2">
              {deckCards.map((card) => (
                <DeckCardItem
                  key={card.id}
                  card={card}
                  onQuantityChange={handleQuantityChange}
                  onRemove={handleRemoveCard}
                />
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {deckCards.length > 0 && (
        <div>
          <h4 className="font-medium text-slate-700 mb-2">デッキ構成</h4>
          <DeckCompositionChart cards={deckCards} />
        </div>
      )}
    </div>
  )

  const renderCardSearch = () => (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {cardCategories.map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(category)}
            className={cn(selectedCategory === category && "bg-purple-600 hover:bg-purple-700 text-white")}
          >
            {category}
          </Button>
        ))}
      </div>

      <Button onClick={() => setIsModalOpen(true)} className="w-full bg-purple-600 hover:bg-purple-700 text-white">
        カード名で検索...
      </Button>

      <div className="text-center text-slate-500 py-8">下のブラウザからカードを追加してください。</div>
    </div>
  )

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Header />

      {/* Desktop Layout */}
      <div className="hidden lg:block">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <Link href="/decks" className="inline-flex items-center text-sm text-purple-600 hover:text-purple-700">
              <ArrowLeft className="h-4 w-4 mr-1" />
              デッキ一覧へ
            </Link>
            <h1 className="text-2xl font-bold text-slate-800">デッキ構築</h1>
            <Button onClick={handleSave} className="bg-emerald-500 hover:bg-emerald-600 text-white">
              <Save className="h-4 w-4 mr-2" />
              保存
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Card Search */}
            <Card>
              <CardHeader>
                <CardTitle>カード検索</CardTitle>
              </CardHeader>
              <CardContent>{renderCardSearch()}</CardContent>
            </Card>

            {/* Right Column - Deck Building */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>デッキ情報</CardTitle>
                </CardHeader>
                <CardContent>{renderDeckInfo()}</CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">{renderDeckComposition()}</CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile/Tablet Layout */}
      <div className="lg:hidden">
        <main className="container mx-auto px-4 py-6 space-y-6">
          <Link href="/decks" className="inline-flex items-center text-sm text-purple-600 hover:text-purple-700">
            <ArrowLeft className="h-4 w-4 mr-1" />
            デッキ一覧へ
          </Link>

          {/* Collapsible Deck Info */}
          <Card>
            <CardHeader className="cursor-pointer" onClick={() => setIsDeckInfoExpanded(!isDeckInfoExpanded)}>
              <div className="flex items-center justify-between">
                <CardTitle>デッキ情報</CardTitle>
                {isDeckInfoExpanded ? (
                  <ChevronUp className="h-5 w-5 text-slate-500" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-slate-500" />
                )}
              </div>
            </CardHeader>
            {isDeckInfoExpanded && <CardContent>{renderDeckInfo()}</CardContent>}
          </Card>

          {/* Deck Composition */}
          <Card>
            <CardContent className="pt-6">{renderDeckComposition()}</CardContent>
          </Card>

          {/* Card Search */}
          <Card>
            <CardContent className="pt-6">{renderCardSearch()}</CardContent>
          </Card>

          {/* Save Button */}
          <Button onClick={handleSave} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3">
            <Save className="h-4 w-4 mr-2" />
            保存
          </Button>
        </main>
      </div>

      <Footer />

      {/* Card Search Modal */}
      <DetailedSearchModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSelectionComplete={handleCardSelectionComplete}
        modalTitle="カードを選択"
      />
    </div>
  )
}
