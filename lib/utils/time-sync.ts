export interface TimeSync {
  deviceTime: number
  serverTime: number
  skew: number
  isSkewed: boolean
}

export async function checkTimeSync(): Promise<TimeSync> {
  const deviceTime = Date.now()

  try {
    // サーバー時刻を取得
    const response = await fetch("/api/time", { method: "GET" })
    const { serverTime } = await response.json()

    const skew = Math.abs(deviceTime - serverTime)
    const isSkewed = skew > 30000 // 30秒以上のずれ

    return {
      deviceTime,
      serverTime,
      skew,
      isSkewed,
    }
  } catch (error) {
    console.warn("Failed to check time sync:", error)
    return {
      deviceTime,
      serverTime: deviceTime,
      skew: 0,
      isSkewed: false,
    }
  }
}

export function formatTimeSkew(skew: number): string {
  const seconds = Math.floor(skew / 1000)
  const minutes = Math.floor(seconds / 60)

  if (minutes > 0) {
    return `${minutes}分${seconds % 60}秒`
  }
  return `${seconds}秒`
}
