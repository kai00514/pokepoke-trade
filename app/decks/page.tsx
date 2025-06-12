"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { PlusCircle, Users, ListChecks, BarChartBig, Zap, type Icon } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import DeckCard, { type Deck } from "@/components/deck-card"
import { useSwipeable } from "react-swipeable"
import { motion, AnimatePresence } from "framer-motion"

type TabId = "posted" | "tier" | "featured" | "newpack"

interface TabInfo {
  id: TabId
  label: string
  icon: Icon
}

const tabs: TabInfo[] = [
  { id: "posted", label: "投稿", icon: Users },
  { id: "tier", label: "Tierラン", icon: ListChecks },
  { id: "featured", label: "注目", icon: BarChartBig },
  { id: "newpack", label: "新パック", icon: Zap },
]

const sampleDecks: Deck[] = [
  {
    id: "1",
    name: "アルセウスVSTARデッキ",
    imageUrl: "/placeholder.svg?width=150&height=210",
    cardName: "アルセウスVSTAR",
    updatedAt: "2025/6/7",
    likes: 120,
    favorites: 35,
    views: 1500,
  },
  {
    id: "2",
    name: "ミュウVMAX速攻",
    imageUrl: "/placeholder.svg?width=150&height=210",
    cardName: "ミュウVMAX",
    updatedAt: "2025/6/5",
    likes: 250,
    favorites: 80,
    views: 3200,
  },
  {
    id: "3",
    name: "ギラティナVSTARコントロール",
    imageUrl: "/placeholder.svg?width=150&height=210",
    cardName: "ギラティナVSTAR",
    updatedAt: "2025/6/3",
    likes: 180,
    favorites: 60,
    views: 2200,
  },
  {
    id: "4",
    name: "ルギアVSTARアッセンブル",
    imageUrl: "/placeholder.svg?width=150&height=210",
    cardName: "ルギアVSTAR",
    updatedAt: "2025/6/1",
    likes: 300,
    favorites: 95,
    views: 4500,
  },
  {
    id: "5",
    name: "未来バレット",
    imageUrl: "/placeholder.svg?width=150&height=210",
    cardName: "テツノブジンex",
    updatedAt: "2025/5/28",
    likes: 90,
    favorites: 20,
    views: 1100,
  },
  {
    id: "6",
    name: "ロストゾーン軸カイオーガ",
    imageUrl: "/placeholder.svg?width=150&height=210",
    cardName: "カイオーガ",
    updatedAt: "2025/5/25",
    likes: 150,
    favorites: 45,
    views: 1800,
  },
]

const swipeConfidenceThreshold = 10000 // Adjust as needed
const swipePower = (offset: number, velocity: number) => Math.abs(offset) * velocity

const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? "100%" : "-100%",
    opacity: 0,
    transition: { type: "tween", ease: "easeInOut", duration: 0.3 },
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
    transition: { type: "tween", ease: "easeInOut", duration: 0.3 },
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? "100%" : "-100%",
    opacity: 0,
    transition: { type: "tween", ease: "easeInOut", duration: 0.3 },
  }),
}

export default function DecksPage() {
  const [activeTabIndex, setActiveTabIndex] = useState(0)
  const [direction, setDirection] = useState(0) // 0: none, 1: next, -1: prev
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  const activeTabId = tabs[activeTabIndex].id

  const changeTab = useCallback(
    (newIndex: number) => {
      if (newIndex === activeTabIndex) return

      setDirection(newIndex > activeTabIndex ? 1 : -1)
      setActiveTabIndex(newIndex)
    },
    [activeTabIndex],
  )

  useEffect(() => {
    const activeTabElement = tabRefs.current[activeTabIndex]
    if (activeTabElement) {
      activeTabElement.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      })
    }
  }, [activeTabIndex])

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (activeTabIndex < tabs.length - 1) {
        changeTab(activeTabIndex + 1)
      }
    },
    onSwipedRight: () => {
      if (activeTabIndex > 0) {
        changeTab(activeTabIndex - 1)
      }
    },
    preventScrollOnSwipe: true,
    trackMouse: true, // Optional: for mouse swiping on desktop for testing
  })

  const renderDeckList = () => {
    const decksToDisplay = sampleDecks // Replace with actual data fetching/filtering
    if (decksToDisplay.length === 0) {
      return <div className="p-4 text-center text-slate-500">表示できるデッキがありません。</div>
    }
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {decksToDisplay.map((deck) => (
          <DeckCard key={deck.id} deck={deck} />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-100">
      <Header />
      <main className="flex-grow container mx-auto px-0 sm:px-4 pb-8">
        <div className="my-6 flex justify-center px-4 sm:px-0">
          <Button
            asChild
            className="bg-emerald-500 hover:bg-emerald-600 text-white text-base font-semibold py-3 px-8 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 ease-in-out transform hover:-translate-y-0.5"
          >
            <Link href="/decks/create">
              <PlusCircle className="mr-2 h-5 w-5" />
              デッキを投稿する
            </Link>
          </Button>
        </div>

        <div className="sticky top-0 z-10 bg-slate-100 shadow-sm">
          <div className="flex justify-center">
            <div className="flex overflow-x-auto whitespace-nowrap border-b border-slate-200">
              {tabs.map((tab, index) => (
                <button
                  key={tab.id}
                  ref={(el) => (tabRefs.current[index] = el)}
                  onClick={() => changeTab(index)}
                  className={cn(
                    "flex flex-col items-center justify-center p-3 min-h-[60px] min-w-[80px] sm:min-w-[90px] md:min-w-[100px] transition-colors duration-150 ease-in-out",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-1",
                    activeTabIndex === index
                      ? "text-purple-600 border-b-2 border-purple-600 font-semibold"
                      : "text-slate-500 hover:text-purple-500 hover:bg-slate-200/50",
                  )}
                  style={{ flexShrink: 0 }}
                >
                  <tab.icon className="h-4 w-4 mb-1" />
                  <span className="text-xs sm:text-sm">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div {...swipeHandlers} className="mt-6 px-4 sm:px-0 overflow-hidden">
          {" "}
          {/* Added overflow-hidden for animation containment */}
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={activeTabId}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              className="will-change-transform" // Optimization for animations
            >
              {renderDeckList()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
      <Footer />
    </div>
  )
}
