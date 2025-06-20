import { createBrowserClient } from "@/lib/supabase/client"

const supabase = createBrowserClient()

export async function testRpcConnection(): Promise<{ error: string | null; data?: any }> {
  console.log("🧪 Testing RPC connection...")

  try {
    // 1. 簡単な関数をテスト
    console.log("🧪 Testing simple function...")
    const { data: testData, error: testError } = await supabase.rpc("test_function")
    console.log("🧪 Simple function result:", { testData, testError })

    if (testError) {
      return { error: `Simple function failed: ${testError.message}` }
    }

    // 2. パラメータ付き関数をテスト
    console.log("🧪 Testing function with parameter...")
    const { data: paramData, error: paramError } = await supabase.rpc("test_with_param", {
      test_input: "Hello World",
    })
    console.log("🧪 Parameter function result:", { paramData, paramError })

    if (paramError) {
      return { error: `Parameter function failed: ${paramError.message}` }
    }

    return { error: null, data: { testData, paramData } }
  } catch (err) {
    console.error("🧪 Exception during RPC test:", err)
    return { error: err instanceof Error ? err.message : "Unknown error" }
  }
}

export async function testLikeDeck(deckId: string): Promise<{ error: string | null; data?: any }> {
  console.log("👍 Testing likeDeck with deckId:", deckId)

  try {
    // まず、デッキが存在するかを確認
    console.log("👍 Checking if deck exists...")
    const { data: deckData, error: deckError } = await supabase
      .from("decks")
      .select("id, like_count")
      .eq("id", deckId)
      .single()

    console.log("👍 Deck check result:", { deckData, deckError })

    if (deckError) {
      return { error: `Deck not found: ${deckError.message}` }
    }

    // RPC関数を呼び出し
    console.log("👍 Calling increment_deck_likes RPC...")
    const { data: rpcData, error: rpcError } = await supabase.rpc("increment_deck_likes", {
      deck_id_input: deckId,
    })

    console.log("👍 RPC result:", { rpcData, rpcError })

    if (rpcError) {
      return { error: `RPC failed: ${rpcError.message}` }
    }

    return { error: null, data: rpcData }
  } catch (err) {
    console.error("👍 Exception during likeDeck test:", err)
    return { error: err instanceof Error ? err.message : "Unknown error" }
  }
}
