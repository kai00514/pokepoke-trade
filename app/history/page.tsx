"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { Archive, MessageCircle, Users, type LucideIcon } from "lucide-react" // Changed Users to Archive for "My Posts"
import { cn } from "@/lib/utils"
import HistoryItemCard, { type HistoryItem } from "@/components/history-item-card"
import { useSwipeable } from "react-swipeable"
import { motion, AnimatePresence } from "framer-motion"

type TabId = "myPosts" | "commentedPosts" | "matchingHistory"

interface TabInfo {
  id: TabId
  label: string
  icon: LucideIcon
}

const tabs: TabInfo[] = [
  { id: "myPosts", label: "自分の募集", icon: Archive },
  { id: "commentedPosts", label: "コメントした募集", icon: MessageCircle },
  { id: "matchingHistory", label: "マッチング履歴", icon: Users },
]

// Sample Data (replace with actual data fetching)
const sampleMyPosts: HistoryItem[] = [
  {
    id: "post1",
    title: "フシギバナを求む",
    primaryCardName: "フシギバナ",
    primaryCardImageUrl: "/placeholder.svg?width=80&height=112",
    postedDateRelative: "9日前",
    status: "canceled",
    commentCount: 1,
    postUrl: "/posts/post1",
  },
  {
    id: "post2",
    title: "ナゾノクサ交換希望",
    primaryCardName: "ナゾノクサ",
    primaryCardImageUrl: "/placeholder.svg?width=80&height=112",
    postedDateRelative: "21日前",
    status: "completed",
    commentCount: 0,
    postUrl: "/posts/post2",
  },
  {
    id: "post3",
    title: "シェルダー探してます",
    primaryCardName: "シェルダー",
    primaryCardImageUrl: "/placeholder.svg?width=80&height=112",
    postedDateRelative: "21日前",
    status: "open",
    commentCount: 0,
    postUrl: "/posts/post3",
  },
  {
    id: "post4",
    title: "通知テスト2",
    primaryCardName: "ラフレシア",
    primaryCardImageUrl: "/placeholder.svg?width=80&height=112",
    postedDateRelative: "22日前",
    status: "in_progress",
    commentCount: 2,
    postUrl: "/posts/post4",
  },
]

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

export default function HistoryPage() {
  const [activeTabIndex, setActiveTabIndex] = useState(0)
  const [direction, setDirection] = useState(0)
  const tabButtonRefs = useRef<(HTMLButtonElement | null)[]>([])

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
    tabButtonRefs.current[activeTabIndex]?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    })
  }, [activeTabIndex])

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => activeTabIndex < tabs.length - 1 && changeTab(activeTabIndex + 1),
    onSwipedRight: () => activeTabIndex > 0 && changeTab(activeTabIndex - 1),
    preventScrollOnSwipe: true,
    trackMouse: true,
  })

  const renderContent = () => {
    let items: HistoryItem[] = []
    let emptyMessage = "履歴がありません。"

    switch (activeTabId) {
      case "myPosts":
        items = sampleMyPosts
        emptyMessage = "あなたの募集履歴はありません。"
        break
      case "commentedPosts":
        // items = sampleCommentedPosts; // Replace with actual data
        emptyMessage = "コメントした募集の履歴はありません。"
        break
      case "matchingHistory":
        // items = sampleMatchingHistory; // Replace with actual data
        emptyMessage = "マッチング履歴はありません。"
        break
    }

    if (items.length === 0) {
      return <div className="text-center py-10 text-slate-500">{emptyMessage}</div>
    }

    return (
      <div className="space-y-4">
        {items.map((item) => (
          <HistoryItemCard key={item.id} item={item} />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Header />
      <main className="flex-grow container mx-auto px-0 sm:px-4 pb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 text-center my-6 sm:my-8 px-4 sm:px-0">履歴</h1>

        {/* Tab Bar */}
        <div className="sticky top-0 z-10 bg-slate-50/90 backdrop-blur-sm shadow-sm">
          <div className="flex justify-center">
            <div className="flex overflow-x-auto whitespace-nowrap border-b border-slate-200">
              {tabs.map((tab, index) => (
                <button
                  key={tab.id}
                  ref={(el) => (tabButtonRefs.current[index] = el)}
                  onClick={() => changeTab(index)}
                  className={cn(
                    "flex items-center justify-center space-x-2 p-3 sm:p-4 min-h-[56px] min-w-[100px] sm:min-w-[140px] transition-colors duration-150 ease-in-out",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-1",
                    activeTabIndex === index
                      ? "text-purple-600 border-b-2 border-purple-600 font-semibold"
                      : "text-slate-500 hover:text-purple-500 hover:bg-slate-100",
                  )}
                  style={{ flexShrink: 0 }}
                >
                  <tab.icon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  <span className="text-sm sm:text-base">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div {...swipeHandlers} className="mt-6 px-4 sm:px-0 overflow-hidden">
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={activeTabId}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              className="will-change-transform"
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
      <Footer />
    </div>
  )
}
