import { SupabaseTest } from "@/components/supabase-test"

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">PokePoke Trade Kanban</h1>
          <p className="text-lg text-gray-600">Supabase integration setup complete</p>
        </div>

        <div className="flex justify-center">
          <SupabaseTest />
        </div>
      </div>
    </main>
  )
}
