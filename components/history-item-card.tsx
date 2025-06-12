import Image from "next/image"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, CheckCircle, XCircle, Zap, Clock, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export type HistoryStatus = "open" | "in_progress" | "completed" | "canceled"

export interface HistoryItem {
  id: string
  title: string
  primaryCardName: string
  primaryCardImageUrl: string
  postedDateRelative: string // e.g., "9日前"
  status: HistoryStatus
  commentCount: number
  postUrl: string
}

interface StatusConfig {
  label: string
  Icon: LucideIcon
  badgeClass: string
  iconClass: string
}

const statusMap: Record<HistoryStatus, StatusConfig> = {
  open: { label: "募集中", Icon: Zap, badgeClass: "bg-sky-100 text-sky-700 border-sky-300", iconClass: "text-sky-600" },
  in_progress: {
    label: "進行中",
    Icon: Clock,
    badgeClass: "bg-amber-100 text-amber-700 border-amber-300",
    iconClass: "text-amber-600",
  },
  completed: {
    label: "取引完了",
    Icon: CheckCircle,
    badgeClass: "bg-emerald-100 text-emerald-700 border-emerald-300",
    iconClass: "text-emerald-600",
  },
  canceled: {
    label: "キャンセル",
    Icon: XCircle,
    badgeClass: "bg-rose-100 text-rose-700 border-rose-300",
    iconClass: "text-rose-600",
  },
}

export default function HistoryItemCard({ item }: { item: HistoryItem }) {
  const statusInfo = statusMap[item.status]

  return (
    <Link href={item.postUrl} className="block group">
      <Card className="overflow-hidden transition-all duration-200 ease-in-out group-hover:shadow-lg bg-white hover:border-purple-300">
        <CardContent className="p-4 flex items-center space-x-4">
          <div className="relative w-16 h-20 sm:w-20 sm:h-28 flex-shrink-0">
            <Image
              src={item.primaryCardImageUrl || "/placeholder.svg"}
              alt={item.primaryCardName}
              fill
              sizes="(max-width: 640px) 25vw, 10vw"
              className="object-contain rounded-md border border-slate-200 bg-slate-50"
            />
          </div>
          <div className="flex-grow min-w-0">
            <h3 className="text-base sm:text-lg font-semibold text-slate-800 group-hover:text-purple-600 truncate transition-colors">
              {item.title}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 truncate">{item.primaryCardName}</p>
            <p className="text-xs text-slate-400 mt-0.5">{item.postedDateRelative}</p>
          </div>
          <div className="flex-shrink-0 flex flex-col items-end space-y-1.5 text-right">
            <Badge variant="outline" className={cn("text-xs px-2 py-0.5 font-medium", statusInfo.badgeClass)}>
              <statusInfo.Icon className={cn("h-3.5 w-3.5 mr-1", statusInfo.iconClass)} />
              {statusInfo.label}
            </Badge>
            <div className="flex items-center text-xs text-slate-500">
              <MessageSquare className="h-3.5 w-3.5 mr-1 text-slate-400" />
              <span>コメント: {item.commentCount}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
