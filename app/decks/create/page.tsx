"use client"

import { useState, useCallback, useEffect, useMemo } from "react" // useEffect, useMemo を追加
import Link from "next/link"
import Image from "next/image"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ArrowLeft, ChevronDown, ChevronUp, Trash2, Save, Loader2, Check } from "lucide-react" // Search, Loader2, Check を追加
import { cn } from "@/lib/utils"
import type { Card as CardType } from "@/components/detailed-search-modal" // CardType のインポートパスを確認
import { createBrowserClient } from "@/lib/supabase/client" // Supabaseクライアントを追加
import { useToast } from "@/components/ui/use-toast" // Toastを追加

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

const cardCategoriesForFilter = ["全て", "ポケモン", "トレーナーズ", "グッズ", "どうぐ"] // フィルター用カテゴリ

// 1. カード検索部分の表示を修正 (DetailedSearchModal のようなUIをページ内に)
// 2. 主要エネルギータイプのアイコンサイズを小さく
// 3. デッキの1〜20スロットに選択したカード画像を表示

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

  // Card Search State
  const [searchKeyword, setSearchKeyword] = useState("")
  const [searchCategory, setSearchCategory] = useState("全て")
  const [searchedCards, setSearchedCards] = useState<CardType[]>([])
  const [isLoadingSearch, setIsLoadingSearch] = useState(false)

  const supabase = createBrowserClient()
  const { toast } = useToast()

  const totalCards = deckCards.reduce((sum, card) => sum + card.quantity, 0)
  const maxCards = 20

  const totalCardsInDeck = useMemo(() => {
    return deckCards.reduce((sum, card) => sum + card.quantity, 0)
  }, [deckCards])
  const maxDeckSize = 60 // ポケモンカードの標準デッキ枚数
  const displaySlotsCount = 20 // UI上に表示するスロット数

  // Fetch cards for search
  useEffect(() => {
    async function fetchCards() {
      setIsLoadingSearch(true)
      let query = supabase
        .from("cards")
        .select("id, name, image_url, type_code, rarity_code, category, thumb_url") // thumb_url を追加（あれば）
        .eq("is_visible", true)
        .limit(100) // デフォルト表示のため制限を増やす

      if (searchKeyword.trim()) {
        query = query.ilike("name", `%${searchKeyword.trim()}%`)
      }

      if (searchCategory !== "全て") {
        let dbCategory: string | undefined
        if (searchCategory === "ポケモン") dbCategory = "pokemon"
        else if (searchCategory === "トレーナーズ") dbCategory = "trainers"
        else if (searchCategory === "グッズ") dbCategory = "goods"
        else if (searchCategory === "どうぐ") dbCategory = "tools"
        if (dbCategory) {
          query = query.eq("category", dbCategory)
        }
      }

      query = query.order("id", { ascending: true })

      const { data, error } = await query

      if (error) {
        console.error("Error fetching cards for search:", error)
        toast({
          title: "カード検索エラー",
          description: "カード情報の読み込みに失敗しました。",
          variant: "destructive",
        })
        setSearchedCards([])
      } else if (data) {
        const mappedData: CardType[] = data.map((dbCard) => ({
          id: String(dbCard.id),
          name: dbCard.name,
          // imageUrl: dbCard.thumb_url || dbCard.image_url, // サムネイルがあれば優先
          imageUrl: dbCard.image_url, // 詳細検索モーダルに合わせてimage_urlを使用
          type: dbCard.type_code,
          rarity: dbCard.rarity_code,
          category: String(dbCard.category),
        }))
        setSearchedCards(mappedData)
      }
      setIsLoadingSearch(false)
    }

    // 常に実行（デフォルトで全てのカードを表示）
    const debounceFetch = setTimeout(() => {
      fetchCards()
    }, 300)
    return () => clearTimeout(debounceFetch)
  }, [searchKeyword, searchCategory, supabase, toast])

  const toggleEnergyType = (typeId: string) => {
    setSelectedEnergyTypes((prev) => (prev.includes(typeId) ? prev.filter((id) => id !== typeId) : [...prev, typeId]))
  }

  const addCardToDeck = useCallback(
    (cardToAdd: CardType) => {
      if (totalCardsInDeck >= maxDeckSize) {
        toast({
          title: "デッキ枚数上限",
          description: `デッキには最大${maxDeckSize}枚までしかカードを追加できません。`,
          variant: "destructive",
        })
        return
      }

      setDeckCards((prevDeckCards) => {
        const existingCard = prevDeckCards.find((c) => c.id === cardToAdd.id)
        if (existingCard) {
          // 同名カード4枚制限（基本エネルギー除く）
          const maxQuantity = cardToAdd.category === "energy" ? maxDeckSize : 4 // 基本エネルギーは上限なし、他は4枚
          if (existingCard.quantity < maxQuantity) {
            return prevDeckCards.map((c) => (c.id === cardToAdd.id ? { ...c, quantity: c.quantity + 1 } : c))
          } else {
            toast({ title: "追加制限", description: `${cardToAdd.name}は${maxQuantity}枚までしか追加できません。` })
            return prevDeckCards
          }
        } else {
          return [...prevDeckCards, { ...cardToAdd, quantity: 1 }]
        }
      })
    },
    [totalCardsInDeck, toast],
  )

  const handleQuantityChange = useCallback((cardId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setDeckCards((prev) => prev.filter((card) => card.id !== cardId))
    } else {
      // デッキ全体の枚数上限チェックはaddCardToDeckで行うため、ここでは個数変更のみ
      setDeckCards((prev) => prev.map((card) => (card.id === cardId ? { ...card, quantity: newQuantity } : card)))
    }
  }, [])

  const handleRemoveCard = useCallback((cardId: string) => {
    setDeckCards((prev) => prev.filter((card) => card.id !== cardId))
  }, [])

  const handleRemoveCardFromDeckList = useCallback((cardId: string) => {
    setDeckCards((prev) => prev.filter((card) => card.id !== cardId))
  }, [])

  const handleClearAllCards = () => {
    setDeckCards([])
  }

  const handleSave = () => {
    if (totalCardsInDeck !== maxDeckSize && totalCardsInDeck !== 30) {
      // 60枚またはハーフデッキ30枚
      // 大会ルール等によっては60枚固定。ここでは60枚固定にする。
      toast({
        title: "デッキ枚数エラー",
        description: `デッキは${maxDeckSize}枚で構築してください。現在の枚数: ${totalCardsInDeck}枚`,
        variant: "destructive",
      })
      return
    }
    if (!deckName.trim()) {
      toast({ title: "入力エラー", description: "デッキ名を入力してください。", variant: "destructive" })
      return
    }
    // Implement save functionality
    console.log("Saving deck:", {
      deckName,
      deckDescription,
      selectedEnergyTypes,
      deckCards,
      isPublic,
      totalCardsInDeck,
    })
    toast({ title: "デッキ保存成功", description: `${deckName}を保存しました。` })
  }

  const renderDeckSlots = () => {
    const slots: (DeckCard | null)[] = []
    deckCards.forEach((card) => {
      for (let i = 0; i < card.quantity; i++) {
        if (slots.length < displaySlotsCount) {
          slots.push(card)
        }
      }
    })
    // 残りのスロットをnullで埋める
    while (slots.length < displaySlotsCount) {
      slots.push(null)
    }

    return (
      <div className="grid grid-cols-10 gap-1 sm:gap-1.5">
        {slots.map((cardOrNull, index) => (
          <div
            key={index}
            className={cn(
              "aspect-[5/7] flex items-center justify-center rounded border overflow-hidden",
              cardOrNull ? "border-purple-300 bg-slate-100" : "bg-gray-100 border-gray-300 text-gray-500 text-xs",
            )}
          >
            {cardOrNull ? (
              <Image
                src={
                  cardOrNull.imageUrl ||
                  `/placeholder.svg?width=50&height=70&query=${encodeURIComponent(cardOrNull.name) || "/placeholder.svg"}`
                }
                alt={cardOrNull.name}
                width={50} // Adjust size as needed for slot display
                height={70}
                className="object-contain w-full h-full"
                unoptimized // Ensure small images load correctly
              />
            ) : (
              <span>{index + 1}</span>
            )}
          </div>
        ))}
      </div>
    )
  }

  const renderDeckInfo = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          デッキ名 <span className="text-red-500">*</span>
        </label>
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
                "p-1 rounded-full border-2 transition-all", // p-1 に変更して少し小さく
                selectedEnergyTypes.includes(type.id)
                  ? "border-purple-500 ring-2 ring-purple-200"
                  : "border-gray-300 hover:border-gray-400",
              )}
            >
              <Image src={type.icon || "/placeholder.svg"} alt={type.name} width={20} height={20} className="w-5 h-5" />{" "}
              {/* w-5 h-5 (20px) に変更 */}
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
          デッキ ({totalCardsInDeck}/{maxDeckSize})
        </h3>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAllCards}
            className="text-red-600 hover:text-red-700"
            disabled={deckCards.length === 0}
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
    </div>
  )

  const renderCardSearchSection = () => (
    <div className="space-y-4">
      {/* 検索フィールドを最初に配置 */}
      <Input
        type="text"
        placeholder="カード名で検索..."
        value={searchKeyword}
        onChange={(e) => setSearchKeyword(e.target.value)}
        className="w-full"
      />

      {/* フィルターボタンを検索フィールドの下に配置 */}
      <div className="flex flex-wrap gap-2">
        {cardCategoriesForFilter.map((category) => (
          <Button
            key={category}
            variant={searchCategory === category ? "default" : "outline"}
            size="sm"
            onClick={() => setSearchCategory(category)}
            className={cn(
              searchCategory === category && "bg-purple-600 hover:bg-purple-700 text-white",
              "text-xs px-3 py-1 h-auto",
            )}
          >
            {category}
          </Button>
        ))}
      </div>

      {/* 残りのコンテンツは同じ */}
      {isLoadingSearch && (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      )}

      {!isLoadingSearch && searchedCards.length === 0 && (
        <p className="text-center text-slate-500 py-10">該当するカードが見つかりません。</p>
      )}

      {!isLoadingSearch && searchedCards.length > 0 && (
        <ScrollArea className="h-[400px] sm:h-[500px] border rounded-md p-2 bg-slate-50">
          <div className="grid grid-cols-5 xs:grid-cols-5 sm:grid-cols-6 md:grid-cols-7 lg:grid-cols-5 xl:grid-cols-6 gap-2">
            {searchedCards.map((card) => {
              const cardInDeck = deckCards.find((c) => c.id === card.id)
              const isMaxed = cardInDeck && cardInDeck.quantity >= (card.category === "energy" ? maxDeckSize : 4)
              return (
                <button
                  key={card.id}
                  onClick={() => !isMaxed && addCardToDeck(card)}
                  disabled={isMaxed}
                  className={cn(
                    "aspect-[5/7] relative rounded-md overflow-hidden border-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-1 transition-all cursor-pointer group",
                    cardInDeck ? "border-purple-400" : "border-transparent hover:border-purple-300",
                    isMaxed && "opacity-50 cursor-not-allowed",
                  )}
                  aria-label={`Add card ${card.name}`}
                >
                  <Image
                    src={
                      card.imageUrl || `/placeholder.svg?width=100&height=140&query=${encodeURIComponent(card.name)}`
                    }
                    alt={card.name}
                    fill
                    sizes="(max-width: 400px) 30vw, (max-width: 640px) 22vw, (max-width: 768px) 18vw, (max-width: 1024px) 15vw, 12vw"
                    className="object-cover bg-slate-100"
                  />
                  {cardInDeck && (
                    <div
                      className={cn(
                        "absolute inset-0 flex items-center justify-center",
                        isMaxed ? "bg-red-700/70" : "bg-purple-700/60 group-hover:bg-purple-700/80",
                      )}
                    >
                      <Check className="h-6 w-6 sm:h-8 sm:h-8 text-white stroke-[3px]" />
                    </div>
                  )}
                  {cardInDeck && cardInDeck.quantity > 0 && (
                    <div className="absolute top-1 right-1 bg-black/70 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {cardInDeck.quantity}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  )

  const renderCardSearch = () => (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">{/* cardCategories is not defined here. Removing this section. */}</div>

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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {" "}
            {/* items-start を追加 */}
            {/* Left Column - Card Search */}
            <Card className="sticky top-[calc(var(--header-height,64px)+1.5rem)]">
              {" "}
              {/* ヘッダーの高さを考慮して sticky top を調整 */}
              <CardHeader>
                <CardTitle>カード検索</CardTitle>
              </CardHeader>
              <CardContent>{renderCardSearchSection()}</CardContent>
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
            <CardHeader>
              <CardTitle>カード検索</CardTitle>
            </CardHeader>
            <CardContent>{renderCardSearchSection()}</CardContent>
          </Card>

          {/* Save Button */}
          <Button
            onClick={handleSave}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 sticky bottom-4 z-10 shadow-lg"
          >
            <Save className="h-4 w-4 mr-2" />
            保存
          </Button>
        </main>
      </div>

      <Footer />
      {/* DetailedSearchModal はページ内検索に置き換えたため、呼び出しを削除 */}
    </div>
  )
}
