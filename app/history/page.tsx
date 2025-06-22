"use client"

import dynamic from "next/dynamic"
import { useState, useRef, useEffect, useCallback } from "react"
import Header from "@/components/layout/header"
import Footer from "@/components/footer"
import { Archive, MessageCircle, Users, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import HistoryItemCard, { type HistoryItem } from "@/components/history-item-card"
import { useSwipeable } from "react-swipeable"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/contexts/auth-context"
import { getMyTradePosts, getCommentedTradePosts } from "@/lib/actions/trade-actions"

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

function HistoryPageContent() {
  const [activeTabIndex, setActiveTabIndex] = useState(0)
  const [direction, setDirection] = useState(0)
  const [myPosts, setMyPosts] = useState<HistoryItem[]>([])
  const [commentedPosts, setCommentedPosts] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const tabButtonRefs = useRef<(HTMLButtonElement | null)[]>([])
  const { user, loading: authLoading } = useAuth()
  const isAuthenticated = !!user

  const activeTabId = tabs[activeTabIndex].id

  // データ取得
  useEffect(() => {
    const fetchData = async () => {
      if (authLoading) return // 認証状態の読み込み中は待機

      if (!isAuthenticated || !user?.id) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        // 自分の投稿を取得
        const myPostsResult = await getMyTradePosts(user.id)
        if (myPostsResult.success) {
          setMyPosts(myPostsResult.posts)
        } else {
          console.error("Error fetching my posts:", myPostsResult.error)
        }

        // コメントした投稿を取得
        const commentedPostsResult = await getCommentedTradePosts(user.id)
        if (commentedPostsResult.success) {
          setCommentedPosts(commentedPostsResult.posts)
        } else {
          console.error("Error fetching commented posts:", commentedPostsResult.error)
        }
      } catch (err) {
        console.error("Error fetching history data:", err)
        setError("データの取得に失敗しました。")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [isAuthenticated, user?.id, authLoading])

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
    if (authLoading) {
      return (
        <div className="text-center py-10 text-slate-500">
          <p>認証状態を確認中...</p>
        </div>
      )
    }

    if (!isAuthenticated) {
      return (
        <div className="text-center py-10 text-slate-500">
          <p>履歴を表示するにはログインが必要です。</p>
        </div>
      )
    }

    if (loading) {
      return (
        <div className="text-center py-10 text-slate-500">
          <p>読み込み中...</p>
        </div>
      )
    }

    if (error) {
      return (
        <div className="text-center py-10 text-red-500">
          <p>{error}</p>
        </div>
      )
    }

    let items: HistoryItem[] = []
    let emptyMessage = "履歴がありません。"

    switch (activeTabId) {
      case "myPosts":
        items = myPosts
        emptyMessage = "あなたの募集履歴はありません。"
        break
      case "commentedPosts":
        items = commentedPosts
        emptyMessage = "コメントした募集の履歴はありません。"
        break
      case "matchingHistory":
        // マッチング履歴は後で実装
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
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-0 sm:px-4 pb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 text-center my-6 sm:my-8 px-4 sm:px-0">履歴</h1>

        {/* Tab Bar */}
        <div className="sticky top-0 z-10 bg-purple-50/90 backdrop-blur-sm shadow-sm">
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

// 動的インポートでコンポーネントをラップ
const HistoryPage = dynamic(() => Promise.resolve(HistoryPageContent), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 pb-8">
        <div className="text-center py-10 text-slate-500">
          <p>読み込み中...</p>
        </div>
      </main>
      <Footer />
    </div>
  ),
})

export default HistoryPage
