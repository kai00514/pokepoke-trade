"use client"

import { useState, useCallback, useEffect, useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import Header from "@/components/layout/header"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ArrowLeft, ChevronDown, ChevronUp, Trash2, Save, Loader2, Check, ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Card as CardType } from "@/types/card"
import { createBrowserClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { createDeck, type CreateDeckInput } from "@/lib/actions/deck-posts"
import LoginPromptModal from "@/components/ui/login-prompt-modal"

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

const cardCategoriesForFilter = ["全て", "ポケモン", "トレーナーズ", "グッズ", "どうぐ"]

// レアリティオプションの定義
interface RarityOption {
  dbValue: string // データベースに保存されているレアリティコード
  uiLabel: string // UIに表示するラベル (数字や名称)
  iconPath: string // アイコン画像のパス
}

const rarityOptions: RarityOption[] = [
  { dbValue: "all", uiLabel: "全てのレアリティ", iconPath: "" }, // 全ての場合アイコンなし
  { dbValue: "ダイヤ1", uiLabel: "1", iconPath: "/images/rarities/diamond_single.png" },
  { dbValue: "ダイヤ2", uiLabel: "2", iconPath: "/images/rarities/diamond_single.png" },
  { dbValue: "ダイヤ3", uiLabel: "3", iconPath: "/images/rarities/diamond_single.png" },
  { dbValue: "ダイヤ4", uiLabel: "4", iconPath: "/images/rarities/diamond_single.png" },
  { dbValue: "星1", uiLabel: "1", iconPath: "/images/rarities/star_single.png" },
  { dbValue: "星2", uiLabel: "2", iconPath: "/images/rarities/star_single.png" },
  { dbValue: "星3", uiLabel: "3", iconPath: "/images/rarities/star_single.png" },
  { dbValue: "クラウン", uiLabel: "クラウン", iconPath: "/images/rarities/crown.png" },
  { dbValue: "色1", uiLabel: "色1", iconPath: "/images/rarities/color1.png" },
  { dbValue: "色2", uiLabel: "色2", iconPath: "/images/rarities/color2.png" },
]

// データベースから取得する際にフィルターするレアリティコードのリスト
const allowedRarityDbValues = rarityOptions.filter((opt) => opt.dbValue !== "all").map((opt) => opt.dbValue)

export default function CreateDeckPage() {
  const [deckName, setDeckName] = useState("")
  const [deckDescription, setDeckDescription] = useState("")
  const [selectedEnergyTypes, setSelectedEnergyTypes] = useState<string[]>([])
  const [deckCards, setDeckCards] = useState<DeckCard[]>([])
  const [isPublic, setIsPublic] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [thumbnailCard, setThumbnailCard] = useState<DeckCard | null>(null)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)

  // Mobile layout state
  const [isDeckInfoExpanded, setIsDeckInfoExpanded] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState("全て")

  // Card Search State
  const [searchKeyword, setSearchKeyword] = useState("")
  const [searchCategory, setSearchCategory] = useState("全て")
  const [searchedCards, setSearchedCards] = useState<CardType[]>([])
  const [isLoadingSearch, setIsLoadingSearch] = useState(false)

  // フィルターの状態
  const [selectedRarity, setSelectedRarity] = useState("all") // dbValue を保持
  const [selectedPackId, setSelectedPackId] = useState<string | null>(null)
  const [packOptions, setPackOptions] = useState<{ id: string | null; name: string }[]>([
    { id: null, name: "全てのパック" },
  ])

  const supabase = createBrowserClient()
  const { toast } = useToast()

  const [user, setUser] = useState<any>(null)
  const [isLoadingAuth, setIsLoadingAuth] = useState(true)

  const totalCardsInDeck = useMemo(() => {
    return deckCards.reduce((sum, card) => sum + card.quantity, 0)
  }, [deckCards])
  const maxDeckSize = 20
  const displaySlotsCount = 20

  // Fetch packs
  useEffect(() => {
    async function fetchPacks() {
      const { data, error } = await supabase.from("packs").select("id, name").order("name", { ascending: true })
      if (error) {
        console.error("Error fetching packs:", error)
        toast({
          title: "パック情報エラー",
          description: "パック情報の読み込みに失敗しました。",
          variant: "destructive",
        })
      } else if (data) {
        setPackOptions([{ id: null, name: "全てのパック" }, ...data.map((p) => ({ id: String(p.id), name: p.name }))])
      }
    }
    fetchPacks()
  }, [supabase, toast])

  // Fetch cards for search
  useEffect(() => {
    async function fetchCards() {
      setIsLoadingSearch(true)
      let query = supabase
        .from("cards")
        .select("id, name, image_url, type_code, rarity_code, category, thumb_url, pack_id")
        .eq("is_visible", true)
        .limit(100)

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

      // レアリティフィルター (selectedRarity が "all" でない場合のみ適用)
      if (selectedRarity !== "all") {
        query = query.eq("rarity_code", selectedRarity)
      } else {
        // "全てのレアリティ" が選択された場合、許可されたレアリティのみを表示
        query = query.in("rarity_code", allowedRarityDbValues)
      }

      // パックフィルター
      if (selectedPackId !== null) {
        query = query.eq("pack_id", selectedPackId)
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
          imageUrl: dbCard.image_url,
          type: dbCard.type_code,
          rarity: dbCard.rarity_code,
          category: String(dbCard.category),
          pack_id: String(dbCard.pack_id),
        }))
        setSearchedCards(mappedData)
      }
      setIsLoadingSearch(false)
    }

    const debounceFetch = setTimeout(() => {
      fetchCards()
    }, 300)
    return () => clearTimeout(debounceFetch)
  }, [searchKeyword, searchCategory, selectedRarity, selectedPackId, supabase, toast])

  useEffect(() => {
    async function getUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
      setIsLoadingAuth(false)
    }
    getUser()
  }, [supabase])

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
          // 3回目のクリックで削除（0枚に戻る）
          if (existingCard.quantity >= 2) {
            return prevDeckCards.filter((c) => c.id !== cardToAdd.id)
          } else {
            // 1枚 → 2枚
            return prevDeckCards.map((c) => (c.id === cardToAdd.id ? { ...c, quantity: c.quantity + 1 } : c))
          }
        } else {
          // 新しいカードを1枚追加
          return [...prevDeckCards, { ...cardToAdd, quantity: 1 }]
        }
      })
    },
    [totalCardsInDeck, toast],
  )

  const handleQuantityChange = useCallback((cardId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setDeckCards((prev) => prev.filter((card) => card.id !== cardId))
      // サムネイルカードが削除された場合はサムネイルもクリア
      setThumbnailCard((prev) => (prev?.id === cardId ? null : prev))
    } else {
      setDeckCards((prev) => prev.map((card) => (card.id === cardId ? { ...card, quantity: newQuantity } : card)))
    }
  }, [])

  const handleRemoveCard = useCallback((cardId: string) => {
    setDeckCards((prev) => prev.filter((card) => card.id !== cardId))
    // サムネイルカードが削除された場合はサムネイルもクリア
    setThumbnailCard((prev) => (prev?.id === cardId ? null : prev))
  }, [])

  const handleClearAllCards = () => {
    setDeckCards([])
    setThumbnailCard(null) // サムネイルもクリア
  }

  // デッキスロットのカードクリックでサムネイル選択
  const handleDeckSlotClick = (card: DeckCard) => {
    setThumbnailCard(card)
    toast({
      title: "サムネイル設定",
      description: `${card.name}をサムネイル画像に設定しました。`,
    })
  }

  // 投稿ボタンの活性化条件を修正（ゲスト名の条件を削除）
  const canSave = useMemo(() => {
    return !isLoadingAuth && !isSaving && deckName.trim() && deckCards.length > 0 && totalCardsInDeck === 20
  }, [isLoadingAuth, isSaving, deckName, deckCards.length, totalCardsInDeck])

  const handleSaveClick = () => {
    if (totalCardsInDeck !== 20) {
      toast({
        title: "デッキ枚数エラー",
        description: `デッキは20枚で構築してください。現在の枚数: ${totalCardsInDeck}枚`,
        variant: "destructive",
      })
      return
    }

    if (!deckName.trim()) {
      toast({ title: "入力エラー", description: "デッキ名を入力してください。", variant: "destructive" })
      return
    }

    if (deckCards.length === 0) {
      toast({ title: "入力エラー", description: "デッキにカードを追加してください。", variant: "destructive" })
      return
    }

    if (!user) {
      setShowLoginPrompt(true)
    } else {
      handleSave()
    }
  }

  const handleContinueAsGuest = () => {
    setShowLoginPrompt(false)
    handleSave()
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)

      const deckInput: CreateDeckInput = {
        title: deckName.trim(),
        user_id: user?.id || null,
        guestName: !user ? "ゲスト" : undefined, // ゲスト名を固定
        description: deckDescription.trim() || undefined,
        is_public: isPublic,
        tags: selectedEnergyTypes.length > 0 ? selectedEnergyTypes : undefined,
        deck_cards: deckCards.map((card) => ({
          card_id: Number.parseInt(card.id),
          quantity: card.quantity,
          name: card.name,
          image_url: card.imageUrl,
        })),
        thumbnail_card_id: thumbnailCard ? Number.parseInt(thumbnailCard.id) : undefined,
        is_authenticated: !!user,
      }

      console.log("[handleSave] Saving deck with thumbnail_card_id:", deckInput.thumbnail_card_id)

      const result = await createDeck(deckInput)

      if (result.success) {
        toast({
          title: "デッキ保存成功",
          description: `${deckName}を保存しました。`,
        })

        setDeckName("")
        setDeckDescription("")
        setSelectedEnergyTypes([])
        setDeckCards([])
        setThumbnailCard(null)
        setIsPublic(true)

        window.location.href = "/decks"
      } else {
        throw new Error(result.error || "デッキの保存に失敗しました")
      }
    } catch (error) {
      console.error("デッキ保存中にエラーが発生しました:", error)
      toast({
        title: "保存エラー",
        description: error instanceof Error ? error.message : "デッキの保存に失敗しました。",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
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
    while (slots.length < displaySlotsCount) {
      slots.push(null)
    }

    return (
      <div className="grid grid-cols-10 gap-1 sm:gap-1.5">
        {slots.map((cardOrNull, index) => (
          <div
            key={index}
            className={cn(
              "aspect-[5/7] flex items-center justify-center rounded border overflow-hidden cursor-pointer transition-all",
              cardOrNull
                ? "border-purple-300 bg-slate-100 hover:border-purple-500"
                : "bg-gray-100 border-gray-300 text-gray-500 text-xs",
              cardOrNull && thumbnailCard?.id === cardOrNull.id && "ring-2 ring-yellow-400 border-yellow-400",
            )}
            onClick={() => cardOrNull && handleDeckSlotClick(cardOrNull)}
          >
            {cardOrNull ? (
              <Image
                src={
                  cardOrNull.imageUrl ||
                  `/placeholder.svg?width=50&height=70&query=${encodeURIComponent(cardOrNull.name) || "/placeholder.svg"}`
                }
                alt={cardOrNull.name}
                width={50}
                height={70}
                className="object-contain w-full h-full"
                unoptimized
              />
            ) : (
              <span>{index + 1}</span>
            )}
          </div>
        ))}
      </div>
    )
  }

  const renderThumbnailSelection = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">サムネイル画像</label>
        <p className="text-xs text-slate-500 mb-3">
          デッキ一覧で表示されるサムネイル画像です。下のデッキ構成からカードをクリックして選択してください。
        </p>

        {/* 選択されたサムネイル表示 */}
        <div className="flex justify-center">
          <div className="w-24 h-32 border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center bg-gray-50">
            {thumbnailCard ? (
              <div className="relative w-full h-full">
                <Image
                  src={
                    thumbnailCard.imageUrl ||
                    `/placeholder.svg?width=96&height=128&query=${encodeURIComponent(thumbnailCard.name) || "/placeholder.svg"}`
                  }
                  alt={thumbnailCard.name}
                  fill
                  className="object-contain rounded-md"
                />
                <button
                  onClick={() => setThumbnailCard(null)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            ) : (
              <div className="text-center">
                <ImageIcon className="h-8 w-8 text-gray-400 mx-auto mb-1" />
                <p className="text-xs text-gray-500">未選択</p>
              </div>
            )}
          </div>
        </div>

        {thumbnailCard && <p className="text-center text-sm font-medium text-slate-700 mt-2">{thumbnailCard.name}</p>}
      </div>
    </div>
  )

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

      {/* ゲスト名入力欄を削除 */}
      {!user && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-700">ゲストとして投稿されます。投稿者名は「ゲスト」と表示されます。</p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">主要エネルギータイプ</label>
        <div className="flex flex-wrap gap-2">
          {energyTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => toggleEnergyType(type.id)}
              className={cn(
                "p-1 rounded-full border-2 transition-all",
                selectedEnergyTypes.includes(type.id)
                  ? "border-purple-500 ring-2 ring-purple-200"
                  : "border-gray-300 hover:border-gray-400",
              )}
            >
              <Image src={type.icon || "/placeholder.svg"} alt={type.name} width={20} height={20} className="w-5 h-5" />
            </button>
          ))}
        </div>
      </div>

      {renderThumbnailSelection()}
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

      <p className="text-xs text-slate-500 mb-2">カードをクリックしてサムネイル画像を選択できます</p>

      {renderDeckSlots()}
    </div>
  )

  const renderCardSearchSection = () => (
    <div className="space-y-4">
      <Input
        type="text"
        placeholder="カード名で検索..."
        value={searchKeyword}
        onChange={(e) => setSearchKeyword(e.target.value)}
        className="w-full"
      />

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

      {/* レアリティフィルター */}
      <div className="flex flex-wrap gap-2 items-center">
        {rarityOptions.map((option) => (
          <Button
            key={option.dbValue}
            variant={selectedRarity === option.dbValue ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedRarity(option.dbValue)}
            className={cn(
              selectedRarity === option.dbValue && "bg-purple-600 hover:bg-purple-700 text-white",
              "text-xs px-3 py-1 h-auto flex items-center gap-1",
            )}
          >
            {option.iconPath && (
              <Image
                src={option.iconPath || "/placeholder.svg"}
                alt={option.uiLabel}
                width={option.dbValue.includes("ダイヤ") || option.dbValue.includes("星") ? 16 : 20} // ダイヤと星は小さめ、他は大きめ
                height={option.dbValue.includes("ダイヤ") || option.dbValue.includes("星") ? 16 : 20}
                className="object-contain"
              />
            )}
            {option.uiLabel}
          </Button>
        ))}
      </div>

      {/* パック名フィルター */}
      <div className="flex flex-wrap gap-2">
        {packOptions.map((pack) => (
          <Button
            key={pack.id || "all"}
            variant={selectedPackId === pack.id ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedPackId(pack.id)}
            className={cn(
              selectedPackId === pack.id && "bg-purple-600 hover:bg-purple-700 text-white",
              "text-xs px-3 py-1 h-auto",
            )}
          >
            {pack.name}
          </Button>
        ))}
      </div>

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
              const quantity = cardInDeck?.quantity || 0

              return (
                <button
                  key={card.id}
                  onClick={() => addCardToDeck(card)}
                  className={cn(
                    "aspect-[5/7] relative rounded-md overflow-hidden border-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-1 transition-all cursor-pointer group",
                    quantity > 0 ? "border-purple-400" : "border-transparent hover:border-purple-300",
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
                  {quantity > 0 && (
                    <div className="absolute inset-0 bg-purple-700/60 group-hover:bg-purple-700/80 flex items-center justify-center">
                      <Check className="h-6 w-6 sm:h-8 sm:h-8 text-white stroke-[3px]" />
                    </div>
                  )}
                  {quantity > 0 && (
                    <div className="absolute top-1 right-1 bg-black/70 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {quantity}
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

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-purple-50 to-purple-100">
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
            <Button
              onClick={handleSaveClick}
              className="bg-emerald-500 hover:bg-emerald-600 text-white"
              disabled={!canSave}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  投稿中...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  投稿
                </>
              )}
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <Card className="sticky top-[calc(var(--header-height,64px)+1.5rem)]">
              <CardHeader>
                <CardTitle>カード検索</CardTitle>
              </CardHeader>
              <CardContent>{renderCardSearchSection()}</CardContent>
            </Card>
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

          <Card>
            <CardContent className="pt-6">{renderDeckComposition()}</CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>カード検索</CardTitle>
            </CardHeader>
            <CardContent>{renderCardSearchSection()}</CardContent>
          </Card>

          {isLoadingAuth && <p className="text-center text-slate-500">認証状態を確認中...</p>}

          <Button
            onClick={handleSaveClick}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 sticky bottom-4 z-10 shadow-lg"
            disabled={!canSave}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                投稿中...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                投稿
              </>
            )}
          </Button>
        </main>
      </div>

      <Footer />

      {/* Login Prompt Modal */}
      {showLoginPrompt && (
        <LoginPromptModal onClose={() => setShowLoginPrompt(false)} onContinueAsGuest={handleContinueAsGuest} />
      )}
    </div>
  )
}
