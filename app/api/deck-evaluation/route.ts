import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  const timestamp = new Date().toISOString()
  console.log(`\n=== DECK EVALUATION API START [${timestamp}] ===`)

  try {
    // Step 0: Import createServerClient dynamically to catch import errors
    console.log("STEP 0: Importing Supabase server client...")
    let createServerClient // createClient ではなく createServerClient をインポート
    try {
      const supabaseModule = await import("@/lib/supabase/server")
      createServerClient = supabaseModule.createServerClient // createClient ではなく createServerClient を取得
      console.log("✅ Supabase module imported successfully")
    } catch (importError) {
      console.error("❌ Failed to import Supabase module:", importError)
      return NextResponse.json(
        {
          error: "Supabaseモジュールのインポートに失敗しました",
          details: importError instanceof Error ? importError.message : "不明なエラー",
        },
        { status: 500 },
      )
    }

    // Step 1: Request parsing
    console.log("STEP 1: Parsing request body...")
    let requestData
    try {
      requestData = await request.json()
      console.log("✅ Request body parsed successfully")
      console.log("📝 Request data:", JSON.stringify(requestData, null, 2))
    } catch (parseError) {
      console.error("❌ Failed to parse request body:", parseError)
      return NextResponse.json({ error: "リクエストデータの解析に失敗しました" }, { status: 400 })
    }

    const { deckPageId, userId, score } = requestData
    console.log("📋 Extracted parameters:")
    console.log(`   - deckPageId: ${deckPageId} (type: ${typeof deckPageId})`)
    console.log(`   - userId: ${userId} (type: ${typeof userId})`)
    console.log(`   - score: ${score} (type: ${typeof score})`)

    // Step 2: Input validation
    console.log("\nSTEP 2: Validating input parameters...")
    if (!deckPageId || !userId || !score) {
      console.error("❌ Missing required fields:", { deckPageId: !!deckPageId, userId: !!userId, score: !!score })
      return NextResponse.json({ error: "deckPageId, userId, scoreは必須です" }, { status: 400 })
    }

    const numericScore = Number.parseInt(score)
    console.log(`🔢 Parsed score: ${numericScore}`)
    if (numericScore < 1 || numericScore > 10) {
      console.error(`❌ Invalid score range: ${numericScore}`)
      return NextResponse.json({ error: "スコアは1から10の間で入力してください" }, { status: 400 })
    }
    console.log("✅ Input validation passed")

    // Step 3: Environment variables check (NEXT_PUBLIC_ プレフィックスを使用)
    console.log("\nSTEP 3: Checking environment variables...")
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    console.log(`🌐 SUPABASE_URL: ${supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : "NOT SET"}`)
    console.log(`🔑 SUPABASE_ANON_KEY: ${supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : "NOT SET"}`)

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("❌ Missing Supabase environment variables")
      return NextResponse.json(
        {
          error: "Supabase環境変数が設定されていません",
          details: `URL: ${!!supabaseUrl}, Key: ${!!supabaseAnonKey}`,
        },
        { status: 500 },
      )
    }

    // Step 4: Supabase client creation (createServerClient を await で呼び出す)
    console.log("\nSTEP 4: Creating Supabase client...")
    let supabase
    try {
      supabase = await createServerClient() // createClient ではなく createServerClient を await で呼び出す
      console.log("✅ Supabase client created successfully")
      console.log(`📡 Client type: ${typeof supabase}`)
    } catch (clientError) {
      console.error("❌ Failed to create Supabase client:", clientError)
      console.error("Client error stack:", clientError instanceof Error ? clientError.stack : "No stack")
      return NextResponse.json(
        {
          error: "データベース接続に失敗しました",
          details: clientError instanceof Error ? clientError.message : "不明なエラー",
        },
        { status: 500 },
      )
    }

    // Step 5: RPC function call preparation
    console.log("\nSTEP 5: Preparing RPC function call...")
    const rpcParams = {
      p_deck_page_id: deckPageId,
      p_user_id: userId,
      p_score: numericScore,
    }
    console.log("🎯 RPC parameters:", JSON.stringify(rpcParams, null, 2))

    // Step 6: RPC function execution
    console.log("\nSTEP 6: Executing RPC function...")
    console.log("🚀 Calling update_deck_evaluation...")

    let rpcResult, rpcError
    try {
      const rpcResponse = await supabase.rpc("update_deck_evaluation", rpcParams)
      rpcResult = rpcResponse.data
      rpcError = rpcResponse.error
      console.log("📡 RPC call completed")
      console.log("📊 RPC response structure:", {
        hasData: !!rpcResult,
        hasError: !!rpcError,
        dataType: typeof rpcResult,
        errorType: typeof rpcError,
      })
    } catch (rpcException) {
      console.error("❌ RPC call threw exception:", rpcException)
      console.error("RPC exception stack:", rpcException instanceof Error ? rpcException.stack : "No stack")
      return NextResponse.json(
        {
          error: "RPC関数の実行中に例外が発生しました",
          details: rpcException instanceof Error ? rpcException.message : "不明なエラー",
        },
        { status: 500 },
      )
    }

    // Step 7: RPC result analysis
    console.log("\nSTEP 7: Analyzing RPC results...")
    console.log("📈 RPC result:", JSON.stringify(rpcResult, null, 2))
    console.log("⚠️  RPC error:", JSON.stringify(rpcError, null, 2))

    if (rpcError) {
      console.error("❌ RPC function returned error:")
      console.error("   - Message:", rpcError.message)
      console.error("   - Code:", rpcError.code)
      console.error("   - Details:", rpcError.details)
      console.error("   - Hint:", rpcError.hint)
      return NextResponse.json(
        {
          error: "評価の更新に失敗しました",
          details: rpcError.message,
          code: rpcError.code,
        },
        { status: 500 },
      )
    }

    // Step 8: Response preparation
    console.log("\nSTEP 8: Preparing response...")
    const responseData = {
      success: true,
      newEvalValue: rpcResult?.newEvalValue || 0,
      newEvalCount: rpcResult?.newEvalCount || 0,
    }
    console.log("📤 Response data:", JSON.stringify(responseData, null, 2))

    console.log(`\n=== DECK EVALUATION API SUCCESS [${new Date().toISOString()}] ===\n`)
    return NextResponse.json(responseData)
  } catch (error) {
    console.error(`\n=== DECK EVALUATION API ERROR [${new Date().toISOString()}] ===`)
    console.error("💥 Unexpected error occurred:")
    console.error("   - Type:", typeof error)
    console.error("   - Constructor:", error?.constructor?.name)
    console.error("   - Message:", error instanceof Error ? error.message : String(error))
    console.error("   - Stack:", error instanceof Error ? error.stack : "No stack trace")

    // Additional error properties
    if (error instanceof Error) {
      console.error("   - Name:", error.name)
      console.error("   - Cause:", error.cause)
      Object.getOwnPropertyNames(error).forEach((prop) => {
        if (!["name", "message", "stack", "cause"].includes(prop)) {
          console.error(`   - ${prop}:`, (error as any)[prop])
        }
      })
    }

    console.error("=== END ERROR DETAILS ===\n")

    return NextResponse.json(
      {
        error: "予期しないエラーが発生しました",
        details: error instanceof Error ? error.message : "不明なエラー",
        type: typeof error,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  const timestamp = new Date().toISOString()
  console.log(`\n=== GET DECK EVALUATION API START [${timestamp}] ===`)

  try {
    const { createServerClient } = await import("@/lib/supabase/server") // createClient ではなく createServerClient をインポート
    console.log("🔍 Creating Supabase client for GET request...")
    const supabase = await createServerClient() // createClient ではなく createServerClient を await で呼び出す

    const { searchParams } = new URL(request.url)
    const deckPageId = searchParams.get("deckPageId")
    const userId = searchParams.get("userId")

    console.log("📋 GET parameters:")
    console.log(`   - deckPageId: ${deckPageId}`)
    console.log(`   - userId: ${userId}`)

    if (!deckPageId || !userId) {
      console.error("❌ Missing required GET parameters")
      return NextResponse.json({ error: "deckPageIdとuserIdは必須です" }, { status: 400 })
    }

    console.log("🚀 Calling has_user_evaluated_deck RPC...")
    const { data, error } = await supabase.rpc("has_user_evaluated_deck", {
      p_deck_page_id: deckPageId,
      p_user_id: userId,
    })

    console.log("📊 GET RPC result:", { data, error })

    if (error) {
      console.error("❌ GET RPC error:", error)
      return NextResponse.json({ error: "評価状況の確認に失敗しました" }, { status: 500 })
    }

    const response = { hasEvaluated: data }
    console.log("📤 GET response:", response)
    console.log(`=== GET DECK EVALUATION API SUCCESS [${new Date().toISOString()}] ===\n`)

    return NextResponse.json(response)
  } catch (error) {
    console.error(`\n=== GET DECK EVALUATION API ERROR [${new Date().toISOString()}] ===`)
    console.error("💥 GET API error:", error)
    console.error("=== END GET ERROR ===\n")
    return NextResponse.json({ error: "内部サーバーエラーが発生しました" }, { status: 500 })
  }
}
