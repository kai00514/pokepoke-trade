"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Check,
  X,
  Diamond,
  StarIcon,
  Loader2,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { createBrowserClient } from "@/lib/supabase/client";
import ImagePreviewOverlay from "./image-preview-overlay";

export interface Card {
  id: string;
  name: string;
  imageUrl: string;
  type?: string;
  rarity?: string;
  category?: string;
}

const cardCategoriesForUI = [
  "全て",
  "ポケモン",
  "トレーナーズ",
  "グッズ",
  "どうぐ",
];
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
];

interface RarityOption {
  uiLabel: string;
  dbValue: string;
  Icon?: LucideIcon;
}

const rarityOptions: RarityOption[] = [
  { uiLabel: "全レアリティ", dbValue: "all" },
  { uiLabel: "◇1", dbValue: "ダイヤ1", Icon: Diamond },
  { uiLabel: "◇2", dbValue: "ダイヤ2", Icon: Diamond },
  { uiLabel: "◇3", dbValue: "ダイヤ3", Icon: Diamond },
  { uiLabel: "◇4", dbValue: "ダイヤ4", Icon: Diamond },
  { uiLabel: "☆1", dbValue: "星1", Icon: StarIcon },
];

const allowedDisplayRaritiesDB = [
  "ダイヤ1",
  "ダイヤ2",
  "ダイヤ3",
  "ダイヤ4",
  "星1",
];

interface DetailedSearchModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSelectionComplete: (selectedCards: Card[]) => void;
  maxSelection?: number;
  initialSelectedCards?: Card[];
  modalTitle?: string;
}

export default function DetailedSearchModal({
  isOpen,
  onOpenChange,
  onSelectionComplete,
  maxSelection,
  initialSelectedCards = [],
  modalTitle = "カード詳細検索",
}: DetailedSearchModalProps) {
  const [keyword, setKeyword] = useState("");
  const [selectedCategoryUI, setSelectedCategoryUI] = useState("全て");
  const [selectedRarityDBValue, setSelectedRarityDBValue] = useState("all");
  const [selectedTypeUI, setSelectedTypeUI] = useState("all");
  const [currentSelectedCards, setCurrentSelectedCards] = useState<Card[]>([]);
  const [fetchedCards, setFetchedCards] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [isPreviewOverlayOpen, setIsPreviewOverlayOpen] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [previewCardName, setPreviewCardName] = useState<string | undefined>(
    undefined,
  );

  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressTriggeredRef = useRef(false);
  const isInitializedRef = useRef(false);

  const { toast } = useToast();
  const supabase = createBrowserClient();

  /* ------------------------------ 初期化 ------------------------------ */
  useEffect(() => {
    if (isOpen && !isInitializedRef.current) {
      setCurrentSelectedCards([...initialSelectedCards]);
      isInitializedRef.current = true;
    } else if (!isOpen) {
      isInitializedRef.current = false;
      setIsPreviewOverlayOpen(false);
      setPreviewImageUrl(null);
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    }
  }, [isOpen, initialSelectedCards]);

  /* ------------------------------ カード取得 ------------------------------ */
  useEffect(() => {
    async function fetchCardsFromSupabase() {
      if (!isOpen) return;
      setIsLoading(true);
      let query = supabase
        .from("cards")
        .select("id, name, image_url, type_code, rarity_code, category, thumb_url")
        .eq("is_visible", true);

      if (keyword.trim()) {
        query = query.ilike("name", `%${keyword.trim()}%`);
      }
      if (selectedCategoryUI !== "全て") {
        const categoryMap: Record<string, string> = {
          ポケモン: "pokemon",
          トレーナーズ: "trainers",
          グッズ: "goods",
          どうぐ: "tools",
        };
        const dbCategory = categoryMap[selectedCategoryUI];
        if (dbCategory) query = query.eq("category", dbCategory);
      }
      if (selectedTypeUI !== "all") query = query.eq("type_code", selectedTypeUI);

      if (selectedRarityDBValue === "all")
        query = query.in("rarity_code", allowedDisplayRaritiesDB);
      else query = query.eq("rarity_code", selectedRarityDBValue);

      query = query.order("id", { ascending: true });

      const { data, error } = await query;
      if (error) {
        console.error("Error fetching cards:", error);
        toast({
          title: "データ取得エラー",
          description: "カード情報の読み込みに失敗しました。",
          variant: "destructive",
        });
        setFetchedCards([]);
      } else if (data) {
        const mapped: Card[] = data.map((c) => ({
          id: String(c.id),
          name: c.name,
          imageUrl: c.image_url,
          type: c.type_code,
          rarity: c.rarity_code,
          category: String(c.category),
        }));
        setFetchedCards(mapped);
      }
      setIsLoading(false);
    }
    fetchCardsFromSupabase();
  }, [
    isOpen,
    keyword,
    selectedCategoryUI,
    selectedRarityDBValue,
    selectedTypeUI,
    supabase,
    toast,
  ]);

  /* ------------------------------ 選択トグル ------------------------------ */
  const toggleCardSelection = (card: Card) => {
    setCurrentSelectedCards((prev) => {
      const exists = prev.some((c) => c.id === card.id);
      if (maxSelection === 1) return exists ? [] : [card];
      if (exists) return prev.filter((c) => c.id !== card.id);
      if (maxSelection && prev.length >= maxSelection) {
        toast({
          title: "選択上限",
          description: `最大${maxSelection}枚まで選択できます。`,
          variant: "destructive",
        });
        return prev;
      }
      return [...prev, card];
    });
  };

  /* ------------------------------ 長押し & タップ ------------------------------ */
  const handlePointerDown = (
    e: React.PointerEvent<HTMLButtonElement>,
    card: Card,
  ) => {
    // 右クリック無視
    if (e.pointerType === "mouse" && e.button !== 0) return;

    isLongPressTriggeredRef.current = false;
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);

    longPressTimerRef.current = setTimeout(() => {
      isLongPressTriggeredRef.current = true;
      setPreviewImageUrl(card.imageUrl);
      setPreviewCardName(card.name);
      setIsPreviewOverlayOpen(true);
    }, 500);

    // エミュレーション時のテキスト選択防止
    e.preventDefault();
  };

  const handlePointerUp = (
    _e: React.PointerEvent<HTMLButtonElement>,
    card: Card,
  ) => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    if (!isLongPressTriggeredRef.current) toggleCardSelection(card);
    isLongPressTriggeredRef.current = false;
  };

  const cancelLongPress = () => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    isLongPressTriggeredRef.current = false;
  };

  /* ------------------------------ 完了 ------------------------------ */
  const handleSelectionComplete = () => {
    if (maxSelection === 1 && currentSelectedCards.length !== 1) {
      toast({
        title: "選択エラー",
        description: "カードを1枚選択してください。",
        variant: "destructive",
      });
      return;
    }
    onSelectionComplete([...currentSelectedCards]);
  };

  const selectionText = useMemo(() => {
    let text = `${currentSelectedCards.length}枚選択中`;
    if (maxSelection) text += ` (最大${maxSelection}枚)`;
    return text;
  }, [currentSelectedCards, maxSelection]);

  /* ------------------------------ JSX ------------------------------ */
  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl w-[95vw] h-[90vh] p-0 flex flex-col gap-0">
          {/* Header */}
          <DialogHeader className="p-4 border-b flex-shrink-0">
            <DialogTitle className="text-lg font-semibold">
              {modalTitle}
            </DialogTitle>
            <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
              <X className="h-5 w-5" />
              <span className="sr-only">閉じる</span>
            </DialogClose>
          </DialogHeader>

          {/* Filters & List */}
          <ScrollArea className="flex-grow bg-slate-50/50 min-h-0">
            {/* Filters */}
            <div className="p-4 space-y-4 border-b">
              <Input
                placeholder="キーワード"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />

              {/* Category */}
              <div className="flex flex-wrap gap-2">
                {cardCategoriesForUI.map((c) => (
                  <Button
                    key={c}
                    variant={selectedCategoryUI === c ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategoryUI(c)}
                    className={cn(
                      selectedCategoryUI === c &&
                        "bg-purple-600 hover:bg-purple-700 text-white",
                      "text-xs px-3 py-1 h-auto",
                    )}
                  >
                    {c}
                  </Button>
                ))}
              </div>

              {/* Rarity */}
              <div className="flex flex-wrap gap-2 items-center">
                {rarityOptions.map((o) => (
                  <Button
                    key={o.dbValue}
                    variant={
                      selectedRarityDBValue === o.dbValue ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => setSelectedRarityDBValue(o.dbValue)}
                    className={cn(
                      selectedRarityDBValue === o.dbValue &&
                        "bg-purple-600 hover:bg-purple-700 text-white",
                      "text-xs px-3 py-1 h-auto flex items-center gap-1",
                    )}
                  >
                    {o.Icon && <o.Icon className="h-3 w-3" />} {o.uiLabel.replace(/[◇☆]/g, "")}
                  </Button>
                ))}
              </div>

              {/* Type */}
              <div>
                <p className="text-sm font-medium mb-1 text-slate-700">タイプ</p>
                <div className="flex flex-wrap gap-2">
                  {typesForUI.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTypeUI(t.id)}
                      className={cn(
                        "p-1.5 rounded-md border transition-colors",
                        selectedTypeUI === t.id
                          ? "border-purple-600 ring-2 ring-purple-600 ring-offset-1 bg-purple-50"
                          : "border-slate-300 hover:border-slate-400",
                      )}
                      title={t.name}
                    >
                      {t.icon ? (
                        <Image src={t.icon} alt={t.name} width={28} height={28} />
                      ) : (
                        <span className="h-7 w-7 flex items-center justify-center text-purple-600">
                          <Check className="h-5 w-5" />
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Card List */}
            <div className="p-4 relative">
              {isLoading && (
                <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10">
                  <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
                </div>
              )}
              <div
                className={cn(
                  "transition-opacity duration-300",
                  isLoading ? "opacity-50" : "opacity-100",
                )}
              >
                {fetchedCards.length ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                    {fetchedCards.map((card) => {
                      const selected = currentSelectedCards.some(
                        (c) => c.id === card.id,
                      );
                      return (
                        <button
                          key={card.id}
                          onPointerDown={(e) => handlePointerDown(e, card)}
                          onPointerUp={(e) => handlePointerUp(e, card)}
                          onPointerLeave={cancelLongPress}
                          onPointerCancel={cancelLongPress}
                          className={cn(
                            "aspect-[5/7] relative rounded-md overflow-hidden border-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-1 transition-all cursor-pointer",
                            selected
                              ? "border-purple-600 shadow-lg scale-105"
                              : "border-transparent hover:border-purple-300",
                          )}
                          aria-label={`Select card ${card.name}`}
                        >
                          <Image
                            src={
                              card.imageUrl ||
                              `/placeholder.svg?width=150&height=210&query=${encodeURIComponent(
                                card.name,
                              )}`
                            }
                            alt={card.name}
                            fill
                            sizes="(max-width: 640px) 30vw, (max-width: 768px) 22vw, (max-width: 1024px) 18vw, 15vw"
                            className="object-cover bg-slate-100"
                          />
                          {selected && (
                            <div className="absolute inset-0 bg-purple-700 bg-opacity-60 flex items-center justify-center">
                              <Check className="h-10 w-10 text-white stroke-[3px]" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="col-span-full text-center text-slate-500 py-10">
                    該当するカードが見つかりません。
                  </p>
                )}
              </div>
            </div>
            <ScrollBar orientation="vertical" />
          </ScrollArea>

          {/* Footer */}
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
                    <span className="text-sm font-medium text-slate-700 truncate">
                      {currentSelectedCards[0].name}
                    </span>
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
                選択完了
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* プレビュー */}
      <ImagePreviewOverlay
        isOpen={isPreviewOverlayOpen}
        imageUrl={previewImageUrl}
        cardName={previewCardName}
        onClose={() => setIsPreviewOverlayOpen(false)}
      />
    </>
  );
}
