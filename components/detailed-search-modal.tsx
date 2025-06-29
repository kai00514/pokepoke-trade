"use client"

import type React from "react"

import { useState, useEffect, useMemo, useRef } from "react"
import Image from "next/image"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Check, X, Loader2 } from "lucide-react" // Diamond, StarIcon を削除
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import { createBrowserClient } from "@/lib/supabase/client"
import ImagePreviewOverlay from "./image-preview-overlay"

export interface Card {
  id: string
  name: string
  imageUrl: string
  type?: string
  rarity?: string
  category?: string
  pack_id?: string // pack_id を追加
}

const cardCategoriesForUI = ["全て", "ポケモン", "トレーナーズ", "グッズ", "どうぐ"]
const typesForUI = [
  { name: "全タイプ", icon: null, id: "all" },
  { name: "草", icon: "/images/types/草.png", id: "草" },
  { name: "炎", icon: "/images/types/炎.png", id: "炎" },
  { name: "水", icon: "/images/types/水.png", id: "水" },
  { name: "電気", icon: "/images/types/電気.png", id: "電気" },
  { name: "エスパー", icon: "/images/types/エスパー.png", id: "エスパー" },
  { name: "格闘", icon: "/images/types/格闘.png", id: "格闘" },
  { name: "悪", icon: "/images/types/悪.png", id: "悪" },
  { name: "鋼", icon: "/images/types/鋼.png", id: "鋼" },
  { name: "無色", icon: "/images/types/無色.png", id: "無色" },
  { name: "ドラゴン", icon: "/images/types/ドラゴン.png", id: "ドラゴン" },
]

interface RarityOption {
  uiLabel: string // "1", "2", "3", "4", "全レアリティ"
  dbValue: string // "ダイヤ1", "ダイヤ2", "ダイヤ3", "ダイヤ4", "星1", "all"
  iconPath?: string // Path to the image
  fullUiLabel: string // "ダイヤ1", "星1", "全レアリティ"
}

const rarityOptions: RarityOption[] = [
  { uiLabel: "全レアリティ", dbValue: "all", fullUiLabel: "全レアリティ" },
  { uiLabel: "1", dbValue: "ダイヤ1", iconPath: "/images/rarities/diamond_single.png", fullUiLabel: "ダイヤ1" },
  { uiLabel: "2", dbValue: "ダイヤ2", iconPath: "/images/rarities/diamond_single.png", fullUiLabel: "ダイヤ2" },
  { uiLabel: "3", dbValue: "ダイヤ3", iconPath: "/images/rarities/diamond_single.png", fullUiLabel: "ダイヤ3" },
  { uiLabel: "4", dbValue: "ダイヤ4", iconPath: "/images/rarities/diamond_single.png", fullUiLabel: "ダイヤ4" },
  { uiLabel: "1", dbValue: "星1", iconPath: "/images/rarities/star_single.png", fullUiLabel: "星1" },
]

const allowedDisplayRaritiesDB = ["ダイヤ1", "ダイヤ2", "ダイヤ3", "ダイヤ4", "星1"]

interface DetailedSearchModalProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  onSelectionComplete: (selectedCards: Card[]) => void
  maxSelection?: number
  initialSelectedCards?: Card[]
  modalTitle?: string
}

export default function DetailedSearchModal({
  isOpen,
  onOpenChange,
  onSelectionComplete,
  maxSelection,
  initialSelectedCards = [],
  modalTitle = "カード詳細検索",
}: DetailedSearchModalProps) {
  const [keyword, setKeyword] = useState("")
  const [selectedCategoryUI, setSelectedCategoryUI] = useState("全て")
  const [selectedRarityDBValue, setSelectedRarityDBValue] = useState("all")
  const [selectedTypeUI, setSelectedTypeUI] = useState("all")
  const [selectedPackId, setSelectedPackId] = useState<string | null>(null) // パックIDのステートを追加
  const [packOptions, setPackOptions] = useState<{ id: string; name: string }[]>([]) // パックオプションのステートを追加
  const [currentSelectedCards, setCurrentSelectedCards] = useState<Card[]>([])
  const [fetchedCards, setFetchedCards] = useState<Card[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const [isPreviewOverlayOpen, setIsPreviewOverlayOpen] = useState(false)
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null)
  const [previewCardName, setPreviewCardName] = useState<string | undefined>(undefined)

  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isLongPressTriggeredRef = useRef(false)
  const isInitializedRef = useRef(false)
  const touchStartTimeRef = useRef<number>(0)
  const touchStartPositionRef = useRef<{ x: number; y: number } | null>(null)

  const { toast } = useToast()
  const supabase = createBrowserClient()

  // モーダルが開いたときに初期選択カードを設定
  useEffect(() => {
    if (isOpen && !isInitializedRef.current) {
      console.log("Modal opened, setting initial cards:", initialSelectedCards)
      setCurrentSelectedCards([...initialSelectedCards])
      isInitializedRef.current = true
    } else if (!isOpen) {
      // モーダルが閉じたときにリセット
      isInitializedRef.current = false
      setIsPreviewOverlayOpen(false)
      setPreviewImageUrl(null)
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current)
      }
    }
  }, [isOpen, initialSelectedCards])

  // パックオプションの取得
  useEffect(() => {
    async function fetchPackOptions() {
      if (!isOpen) return
      const { data, error } = await supabase.from("packs").select("id, name").order("name", { ascending: true })
      if (error) {
        console.error("Error fetching packs:", error)
        toast({
          title: "パック情報取得エラー",
          description: "パック情報の読み込みに失敗しました。",
          variant: "destructive",
        })
      } else if (data) {
        setPackOptions([{ id: "all", name: "全てのパック" }, ...data])
      }
    }
    fetchPackOptions()
  }, [isOpen, supabase, toast])

  useEffect(() => {
    async function fetchCardsFromSupabase() {
      if (!isOpen) return
      setIsLoading(true)
      let query = supabase
        .from("cards")
        .select("id, name, image_url, type_code, rarity_code, category, thumb_url, pack_id") // pack_id を選択に追加
        .eq("is_visible", true)

      if (keyword.trim()) {
        query = query.ilike("name", `%${keyword.trim()}%`)
      }
      if (selectedCategoryUI !== "全て") {
        let dbCategory: string | undefined
        if (selectedCategoryUI === "ポケモン") dbCategory = "pokemon"
        else if (selectedCategoryUI === "トレーナーズ") dbCategory = "trainers"
        else if (selectedCategoryUI === "グッズ") dbCategory = "goods"
        else if (selectedCategoryUI === "どうぐ") dbCategory = "tools"
        if (dbCategory) {
          query = query.eq("category", dbCategory)
        }
      }
      if (selectedTypeUI !== "all") {
        query = query.eq("type_code", selectedTypeUI)
      }
      if (selectedRarityDBValue === "all") {
        query = query.in("rarity_code", allowedDisplayRaritiesDB)
      } else {
        query = query.eq("rarity_code", selectedRarityDBValue)
      }
      if (selectedPackId && selectedPackId !== "all") {
        // パックIDによるフィルタリングを追加
        query = query.eq("pack_id", selectedPackId)
      }
      query = query.order("id", { ascending: true })

      const { data, error } = await query
      if (error) {
        console.error("Error fetching cards:", error)
        toast({
          title: "データ取得エラー",
          description: "カード情報の読み込みに失敗しました。",
          variant: "destructive",
        })
        setFetchedCards([])
      } else if (data) {
        const mappedData: Card[] = data.map((dbCard) => ({
          id: String(dbCard.id),
          name: dbCard.name,
          imageUrl: dbCard.image_url,
          type: dbCard.type_code,
          rarity: dbCard.rarity_code,
          category: String(dbCard.category),
          pack_id: dbCard.pack_id, // pack_id をマッピング
        }))
        setFetchedCards(mappedData)
      }
      setIsLoading(false)
    }
    fetchCardsFromSupabase()
  }, [isOpen, keyword, selectedCategoryUI, selectedRarityDBValue, selectedTypeUI, selectedPackId, supabase, toast]) // selectedPackId を依存配列に追加

  const toggleCardSelection = (card: Card) => {
    setCurrentSelectedCards((prevSelected) => {
      const isAlreadySelected = prevSelected.find((sc) => sc.id === card.id)
      if (maxSelection === 1) return isAlreadySelected ? [] : [card]
      if (isAlreadySelected) return prevSelected.filter((sc) => sc.id !== card.id)
      if (maxSelection && prevSelected.length >= maxSelection) {
        toast({ title: "選択上限", description: `最大${maxSelection}枚まで選択できます。`, variant: "destructive" })
        return prevSelected
      }
      return [...prevSelected, card]
    })
  }

  // 改善されたタッチイベント処理
  const handleTouchStart = (card: Card, e: React.TouchEvent) => {
    // デフォルトの動作を防ぐ（スクロールなど）
    e.preventDefault()

    const touch = e.touches[0]
    touchStartTimeRef.current = Date.now()
    touchStartPositionRef.current = { x: touch.clientX, y: touch.clientY }
    isLongPressTriggeredRef.current = false

    // 既存のタイマーをクリア
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
    }

    // 長押し検出タイマー
    longPressTimerRef.current = setTimeout(() => {
      isLongPressTriggeredRef.current = true
      setPreviewImageUrl(card.imageUrl)
      setPreviewCardName(card.name)
      setIsPreviewOverlayOpen(true)

      // バイブレーション（対応デバイスのみ）
      if (navigator.vibrate) {
        navigator.vibrate(50)
      }
    }, 500) // 500ms で長押し判定
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    // タッチ位置が大きく移動した場合は長押しをキャンセル
    if (touchStartPositionRef.current) {
      const touch = e.touches[0]
      const deltaX = Math.abs(touch.clientX - touchStartPositionRef.current.x)
      const deltaY = Math.abs(touch.clientY - touchStartPositionRef.current.y)

      // 10px以上移動したら長押しキャンセル
      if (deltaX > 10 || deltaY > 10) {
        if (longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current)
        }
        isLongPressTriggeredRef.current = false
      }
    }
  }

  const handleTouchEnd = (card: Card, e: React.TouchEvent) => {
    e.preventDefault()

    // タイマーをクリア
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
    }

    const touchDuration = Date.now() - touchStartTimeRef.current

    // 短いタップかつ長押しが発動していない場合のみ選択処理
    if (!isLongPressTriggeredRef.current && touchDuration < 500) {
      toggleCardSelection(card)
    }

    // リセット
    isLongPressTriggeredRef.current = false
    touchStartPositionRef.current = null
  }

  const handleTouchCancel = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
    }
    isLongPressTriggeredRef.current = false
    touchStartPositionRef.current = null
  }

  // PC用のマウスイベント処理
  const handleMouseDown = (card: Card) => {
    isLongPressTriggeredRef.current = false
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current)

    longPressTimerRef.current = setTimeout(() => {
      isLongPressTriggeredRef.current = true
      setPreviewImageUrl(card.imageUrl)
      setPreviewCardName(card.name)
      setIsPreviewOverlayOpen(true)
    }, 500)
  }

  const handleMouseUp = (card: Card) => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current)
    if (!isLongPressTriggeredRef.current) {
      toggleCardSelection(card)
    }
    isLongPressTriggeredRef.current = false
  }

  const handleMouseLeave = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
    }
    isLongPressTriggeredRef.current = false
  }

  const handleSelectionComplete = () => {
    if (maxSelection === 1 && currentSelectedCards.length !== 1) {
      toast({ title: "選択エラー", description: "カードを1枚選択してください。", variant: "destructive" })
      return
    }
    console.log("Completing selection with cards:", currentSelectedCards)
    onSelectionComplete([...currentSelectedCards]) // 配列をコピーして渡す
  }

  const selectionText = useMemo(() => {
    let text = `${currentSelectedCards.length}枚選択中`
    if (maxSelection) text += ` (最大${maxSelection}枚)`
    return text
  }, [currentSelectedCards, maxSelection])

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl w-[95vw] h-[90vh] p-0 flex flex-col gap-0">
          <DialogHeader className="p-4 border-b flex-shrink-0">
            <DialogTitle className="text-lg font-semibold">{modalTitle}</DialogTitle>
            <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
              <X className="h-5 w-5" />
              <span className="sr-only">閉じる</span>
            </DialogClose>
          </DialogHeader>

          <ScrollArea className="flex-grow bg-slate-50/50 min-h-0">
            <div className="p-4 space-y-4 border-b">
              <Input
                type="text"
                placeholder="キーワード"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="flex-grow"
              />
              <div className="flex flex-wrap gap-2">
                {cardCategoriesForUI.map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategoryUI === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategoryUI(category)}
                    className={cn(
                      selectedCategoryUI === category && "bg-purple-600 hover:bg-purple-700 text-white",
                      "text-xs px-3 py-1 h-auto",
                    )}
                  >
                    {category}
                  </Button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                {rarityOptions.map((option) => (
                  <Button
                    key={option.dbValue}
                    variant={selectedRarityDBValue === option.dbValue ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedRarityDBValue(option.dbValue)}
                    className={cn(
                      selectedRarityDBValue === option.dbValue && "bg-purple-600 hover:bg-purple-700 text-white",
                      "text-xs px-3 py-1 h-auto flex items-center gap-1",
                    )}
                  >
                    {option.iconPath && option.dbValue !== "all" ? (
                      <Image
                        src={option.iconPath || "/placeholder.svg"}
                        alt={option.fullUiLabel}
                        width={16}
                        height={16}
                        className="object-contain"
                      />
                    ) : option.dbValue === "all" ? (
                      <Check className="h-3 w-3" />
                    ) : null}
                    {option.uiLabel}
                  </Button>
                ))}
              </div>
              <div>
                <p className="text-sm font-medium mb-1 text-slate-700">タイプ</p>
                <div className="flex flex-wrap gap-2">
                  {typesForUI.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setSelectedTypeUI(type.id)}
                      className={cn(
                        "p-1.5 rounded-md border transition-colors",
                        selectedTypeUI === type.id
                          ? "border-purple-600 ring-2 ring-purple-600 ring-offset-1 bg-purple-50"
                          : "border-slate-300 hover:border-slate-400",
                      )}
                      title={type.name}
                    >
                      {type.icon ? (
                        <Image src={type.icon || "/placeholder.svg"} alt={type.name} width={28} height={28} />
                      ) : (
                        <span className="h-7 w-7 flex items-center justify-center text-purple-600">
                          <Check className="h-5 w-5" />
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium mb-1 text-slate-700">パック名</p>
                <div className="flex flex-wrap gap-2">
                  {packOptions.map((pack) => (
                    <Button
                      key={pack.id}
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
              </div>
            </div>

            <div className="p-4 relative">
              {isLoading && (
                <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10">
                  <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
                </div>
              )}
              <div className={cn("transition-opacity duration-300", isLoading ? "opacity-50" : "opacity-100")}>
                {fetchedCards.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                    {fetchedCards.map((card) => (
                      <button
                        key={card.id}
                        onMouseDown={() => handleMouseDown(card)}
                        onMouseUp={() => handleMouseUp(card)}
                        onMouseLeave={handleMouseLeave}
                        onTouchStart={(e) => handleTouchStart(card, e)}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={(e) => handleTouchEnd(card, e)}
                        onTouchCancel={handleTouchCancel}
                        className={cn(
                          "aspect-[5/7] relative rounded-md overflow-hidden border-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-1 transition-all cursor-pointer select-none",
                          currentSelectedCards.find((sc) => sc.id === card.id)
                            ? "border-purple-600 shadow-lg scale-105"
                            : "border-transparent hover:border-purple-300",
                        )}
                        aria-label={`Select card ${card.name}`}
                        style={{
                          touchAction: "none", // タッチ操作の最適化
                          WebkitTouchCallout: "none", // iOS Safari での長押しメニューを無効化
                          WebkitUserSelect: "none", // テキスト選択を無効化
                          userSelect: "none",
                        }}
                      >
                        <Image
                          src={
                            card.imageUrl ||
                            `/placeholder.svg?width=150&height=210&query=${encodeURIComponent(card.name) || "card"}`
                          }
                          alt={card.name}
                          fill
                          sizes="(max-width: 640px) 30vw, (max-width: 768px) 22vw, (max-width: 1024px) 18vw, 15vw"
                          className="object-cover bg-slate-100 pointer-events-none" // pointer-events-noneを追加
                          draggable={false} // ドラッグを無効化
                        />
                        {currentSelectedCards.find((sc) => sc.id === card.id) && (
                          <div className="absolute inset-0 bg-purple-700 bg-opacity-60 flex items-center justify-center">
                            <Check className="h-10 w-10 text-white stroke-[3px]" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="col-span-full text-center text-slate-500 py-10">該当するカードが見つかりません。</p>
                )}
              </div>
            </div>
            <ScrollBar orientation="vertical" />
          </ScrollArea>

          <DialogFooter className="p-4 border-t bg-white flex-shrink-0">
            <div className="flex justify-between items-center w-full">
              {maxSelection === 1 && currentSelectedCards.length === 1 ? (
                <div className="flex items-center gap-2 overflow-hidden">
                  <Image
                    src={currentSelectedCards[0].imageUrl || "/placeholder.svg"}
                    alt={currentSelectedCards[0].name}
                    width={32}
                    height={45}
                    className="rounded object-contain border bg-slate-100"
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium text-slate-700 truncate">{currentSelectedCards[0].name}</span>
                    <span className="text-xs text-slate-500">{selectionText}</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-600">{selectionText}</p>
              )}
              <Button
                onClick={handleSelectionComplete}
                className="bg-purple-600 hover:bg-purple-700 text-white"
                disabled={
                  (maxSelection === 1 && currentSelectedCards.length !== 1) ||
                  (maxSelection !== 1 && currentSelectedCards.length === 0 && !!maxSelection)
                }
              >
                {"選択完了"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ImagePreviewOverlay
        isOpen={isPreviewOverlayOpen}
        imageUrl={previewImageUrl}
        cardName={previewCardName}
        onClose={() => setIsPreviewOverlayOpen(false)}
      />
    </>
  )
}
