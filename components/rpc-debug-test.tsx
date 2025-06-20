"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { testRpcConnection, testLikeDeck } from "@/lib/services/deck-service-debug"

export default function RpcDebugTest() {
  const [testResults, setTestResults] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)

  const runConnectionTest = async () => {
    setIsLoading(true)
    setTestResults("RPC接続テストを実行中...")

    try {
      const result = await testRpcConnection()
      setTestResults(JSON.stringify(result, null, 2))
    } catch (err) {
      setTestResults(`エラー: ${err}`)
    } finally {
      setIsLoading(false)
    }
  }

  const runLikeTest = async () => {
    setIsLoading(true)
    setTestResults("いいね機能テストを実行中...")

    // テスト用のデッキIDを使用（実際のデッキIDに置き換えてください）
    const testDeckId = "test-deck-id" // 実際のデッキIDに置き換える

    try {
      const result = await testLikeDeck(testDeckId)
      setTestResults(JSON.stringify(result, null, 2))
    } catch (err) {
      setTestResults(`エラー: ${err}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>RPC関数デバッグテスト</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={runConnectionTest} disabled={isLoading}>
            RPC接続テスト
          </Button>
          <Button onClick={runLikeTest} disabled={isLoading}>
            いいね機能テスト
          </Button>
        </div>

        {testResults && (
          <div className="bg-gray-100 p-4 rounded-md">
            <h3 className="font-semibold mb-2">テスト結果:</h3>
            <pre className="text-sm overflow-auto">{testResults}</pre>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
