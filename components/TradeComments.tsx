import { useState, useEffect } from "react"
import { addComment, getComments } from "@/lib/actions/trade-comments"

interface TradeCommentsProps {
  postId: string
  currentUser?: { id?: string; name?: string } | null
}

export default function TradeComments({ postId, currentUser }: TradeCommentsProps) {
  const [comments, setComments] = useState<any[]>([])
  const [content, setContent] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchComments()
    // eslint-disable-next-line
  }, [postId])

  async function fetchComments() {
    setLoading(true)
    const res = await getComments(postId)
    if (res.success) setComments(res.comments)
    setLoading(false)
  }

  async function handleAdd() {
    if (!content.trim()) return
    setLoading(true)
    setError(null)
    const payload = {
      postId,
      content,
      userId: currentUser?.id,
      userName: currentUser?.name,
      isGuest: !currentUser,
      guestId: !currentUser ? "guest_" + Math.random().toString(36).slice(2, 10) : undefined,
    }
    const res = await fetch("/api/trade-comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (!data.success) setError(data.error || null)
    setContent("")
    await fetchComments()
    setLoading(false)
  }

  return (
    <div className="mt-6">
      <h3 className="font-bold mb-2">コメント</h3>
      <div className="mb-4">
        <div>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="コメントを入力"
            className="w-full border rounded p-2"
            rows={3}
          />
          <button
            type="button"
            onClick={handleAdd}
            className="mt-2 px-4 py-1 bg-blue-600 text-white rounded disabled:opacity-50"
            disabled={loading || !content.trim()}
          >
            投稿
          </button>
        </div>
        {error && <div className="text-red-500 text-sm mt-1">{error}</div>}
      </div>
      {loading ? <div>読み込み中...</div> : (
        <ul>
          {comments.filter(c => !c.parent_id && !c.is_deleted).map(c => (
            <li key={c.id} className="mb-3 border-b pb-2">
              <div className="flex items-center gap-2">
                <span className="font-bold">{c.user_name || (c.is_guest ? 'ゲスト' : 'ユーザー')}</span>
                <span className="text-xs text-gray-500">{new Date(c.created_at).toLocaleString()}</span>
                {c.is_edited && <span className="text-xs text-yellow-600 ml-2">編集済み</span>}
              </div>
              <div className="mt-1">{c.content}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
