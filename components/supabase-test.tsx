"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function SupabaseTest() {
  const [connectionStatus, setConnectionStatus] = useState<"testing" | "connected" | "error">("testing")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function testConnection() {
      try {
        const supabase = createBrowserClient()
        const { data, error } = await supabase.from("_dummy_table_").select("*").limit(1)

        if (error && error.code !== "PGRST116") {
          // PGRST116 is "table not found" which is expected
          throw error
        }

        setConnectionStatus("connected")
      } catch (err) {
        console.error("Supabase connection error:", err)
        setConnectionStatus("error")
        setError(err instanceof Error ? err.message : "Unknown error")
      }
    }

    testConnection()
  }, [])

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Supabase Connection Test</CardTitle>
        <CardDescription>Testing connection to Supabase database</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          {connectionStatus === "testing" && (
            <>
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
              <span>Testing connection...</span>
            </>
          )}
          {connectionStatus === "connected" && (
            <>
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-green-700">Connected successfully!</span>
            </>
          )}
          {connectionStatus === "error" && (
            <>
              <div className="w-2 h-2 bg-red-500 rounded-full" />
              <div>
                <span className="text-red-700">Connection failed</span>
                {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
