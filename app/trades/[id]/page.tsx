"use client"

// app/trades/[id]/page.tsx

import { updateTradePostStatus } from "@/lib/actions/trade-actions"
import { useAuth } from "@/contexts/auth-context"
import { useState } from "react"

// コンポーネント内でuseAuthを使用
const { user } = useAuth()

// 投稿者向け操作ボタンコンポーネント
const OwnerActionButtons = ({ post, currentUserId }: { post: any; currentUserId: string | null }) => {
  const [isUpdating, setIsUpdating] = useState(false)

  // 投稿者でない場合は何も表示しない
  if (!currentUserId || !post.author?.isOwner || post.author.userId !== currentUserId) {
    return null
  }

  // 既にキャンセルまたは完了している場合は何も表示しない
  if (post.status === "キャンセル" || post.status === "取引完了") {
    return null
  }

  const handleStatusUpdate = async (status: "CANCELED" | "COMPLETED") => {
    if (isUpdating) return

    const action = status === "CANCELED" ? "キャンセル" : "取引完了"
    if (!confirm(`この募集を${action}しますか？`)) return

    setIsUpdating(true)
    try {
      const result = await updateTradePostStatus(post.id, status)
      if (result.success) {
        window.location.reload() // ページをリロードして最新状態を表示
      } else {
        alert(`${action}に失敗しました: ${result.error}`)
      }
    } catch (error) {
      console.error(`Error updating status to ${status}:`, error)
      alert(`${action}中にエラーが発生しました。`)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="mt-6 p-4 bg-slate-50 rounded-lg border">
      <h3 className="text-sm font-medium text-slate-700 mb-3">投稿者操作</h3>
      <div className="flex gap-3">
        <button
          onClick={() => handleStatusUpdate("CANCELED")}
          disabled={isUpdating}
          className="flex-1 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
        >
          {isUpdating ? "処理中..." : "キャンセル"}
        </button>
        <button
          onClick={() => handleStatusUpdate("COMPLETED")}
          disabled={isUpdating}
          className="flex-1 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
        >
          {isUpdating ? "処理中..." : "トレード完了"}
        </button>
      </div>
    </div>
  )
}

export default function TradeDetailPage({ params }: { params: { id: string } }) {
  const { id } = params
  // 仮のデータ
  const post = {
    id: id,
    title: "サンプル募集",
    content: "これはサンプルの募集内容です。",
    status: "募集中",
    author: {
      userId: "user123",
      isOwner: true,
    },
  }

  return (
    <div>
      <h1>募集詳細 (ID: {id})</h1>
      <p>タイトル: {post.title}</p>
      <p>内容: {post.content}</p>
      <p>ステータス: {post.status}</p>
      {/* コメントセクション */}
      <OwnerActionButtons post={post} currentUserId={user?.id || null} />
    </div>
  )
}
