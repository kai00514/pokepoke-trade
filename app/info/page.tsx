"use client"

import Header from "@/components/layout/header"
import Footer from "@/components/footer"
import InfoSection from "@/components/info-section"
import NewsArticleCard, { type NewsArticle } from "@/components/news-article-card"
import { Newspaper, Trophy, CalendarDays, ScrollText, BookMarked, GraduationCap } from "lucide-react"
import { motion } from "framer-motion"

// Sample Data
const sampleNews: NewsArticle[] = [
  {
    id: "news1",
    title: "新パック『時空の創造者』発売開始！伝説のポケモンたちが集結",
    date: "2025-06-15",
    summary:
      "待望の新カードパックが本日より全国の販売店で発売開始。新たな戦略と強力なカードでデッキを強化しよう！注目のカードをチェック！",
    category: "新製品",
    categoryColor: "emerald",
    url: "/news/new-pack-spacetime-creator",
  },
  {
    id: "news2",
    title: "アプリバージョン2.5.0リリースのお知らせ",
    date: "2025-06-10",
    summary:
      "新機能の追加と既存の不具合修正を含む大型アップデートが公開されました。より快適なプレイ体験をお楽しみください。",
    category: "アプリ",
    categoryColor: "sky",
    url: "/news/app-update-2-5-0",
  },
  {
    id: "news3",
    title: "公式ルール改定のお知らせ：2025年7月版",
    date: "2025-06-05",
    summary: "7月1日より適用される新ルールについての詳細が発表されました。大会参加予定の方は必ずご確認ください。",
    category: "ルール",
    categoryColor: "amber",
    url: "/news/rule-update-july-2025",
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2, // Stagger animation for child InfoSection components
    },
  },
}

export default function InformationPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <motion.main
        className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-800 text-center mb-8 sm:mb-12">インフォメーション</h1>

        <div className="space-y-12 sm:space-y-16">
          {/* 最新情報セクション */}
          <InfoSection icon={Newspaper} title="最新情報" viewAllLink="/info/news" viewAllText="すべての最新情報を見る">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sampleNews.map((article, index) => (
                <NewsArticleCard key={article.id} article={article} index={index} />
              ))}
            </div>
          </InfoSection>

          {/* 公式トーナメントセクション (Placeholder) */}
          <InfoSection icon={Trophy} title="公式トーナメント" viewAllLink="/info/tournaments">
            <div className="bg-white p-6 rounded-lg shadow text-center text-slate-500">
              公式トーナメント情報がここに表示されます。
            </div>
          </InfoSection>

          {/* 大会カレンダーセクション (Placeholder) */}
          <InfoSection icon={CalendarDays} title="大会カレンダー" viewAllLink="/info/calendar">
            <div className="bg-white p-6 rounded-lg shadow text-center text-slate-500">
              大会カレンダー情報がここに表示されます。
            </div>
          </InfoSection>

          {/* ルールの基本セクション (Placeholder) */}
          <InfoSection icon={ScrollText} title="ルールの基本" viewAllLink="/info/rules">
            <div className="bg-white p-6 rounded-lg shadow text-center text-slate-500">
              ルールの基本情報がここに表示されます。
            </div>
          </InfoSection>

          {/* 用語集セクション (Placeholder) */}
          <InfoSection icon={BookMarked} title="用語集" viewAllLink="/info/glossary">
            <div className="bg-white p-6 rounded-lg shadow text-center text-slate-500">
              用語集がここに表示されます。
            </div>
          </InfoSection>

          {/* 初心者向けガイドセクション (Placeholder) */}
          <InfoSection icon={GraduationCap} title="初心者向けガイド" viewAllLink="/info/guides">
            <div className="bg-white p-6 rounded-lg shadow text-center text-slate-500">
              初心者向けガイドがここに表示されます。
            </div>
          </InfoSection>
        </div>
      </motion.main>
      <Footer />
    </div>
  )
}
