"use client"

import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, CalendarDays } from "lucide-react"
import { motion } from "framer-motion"

export interface NewsArticle {
  id: string
  title: string
  date: string // YYYY-MM-DD
  summary: string
  category: string
  categoryColor?: "sky" | "emerald" | "amber" | "rose" | "violet" // for badge color
  url: string
}

const categoryColorMap = {
  sky: "bg-sky-100 text-sky-700 border-sky-300 hover:bg-sky-200",
  emerald: "bg-emerald-100 text-emerald-700 border-emerald-300 hover:bg-emerald-200",
  amber: "bg-amber-100 text-amber-700 border-amber-300 hover:bg-amber-200",
  rose: "bg-rose-100 text-rose-700 border-rose-300 hover:bg-rose-200",
  violet: "bg-violet-100 text-violet-700 border-violet-300 hover:bg-violet-200",
  default: "bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200",
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

export default function NewsArticleCard({ article, index }: { article: NewsArticle; index: number }) {
  const badgeColorClass = article.categoryColor ? categoryColorMap[article.categoryColor] : categoryColorMap.default

  return (
    <motion.div
      variants={cardVariants}
      custom={index} // for potential stagger effect if parent uses staggerChildren
    >
      <Card className="overflow-hidden bg-white hover:shadow-lg transition-shadow duration-200 h-full flex flex-col">
        <CardHeader className="pb-3 pt-5 px-5">
          <div className="flex justify-between items-start gap-2 mb-1">
            <Badge variant="outline" className={`text-xs font-medium ${badgeColorClass}`}>
              {article.category}
            </Badge>
            <div className="flex items-center text-xs text-slate-500">
              <CalendarDays className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
              {article.date}
            </div>
          </div>
          <CardTitle className="text-lg font-semibold text-slate-800 leading-tight">
            <Link href={article.url} className="hover:text-purple-600 transition-colors line-clamp-2">
              {article.title}
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-4 text-sm text-slate-600 flex-grow">
          <p className="line-clamp-3">{article.summary}</p>
        </CardContent>
        <CardFooter className="px-5 pb-5 pt-2 bg-slate-50/30 border-t">
          <Link
            href={article.url}
            className="text-sm font-medium text-purple-600 hover:text-purple-700 flex items-center group transition-colors"
          >
            続きを読む
            <ArrowRight className="h-4 w-4 ml-1 transform transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
