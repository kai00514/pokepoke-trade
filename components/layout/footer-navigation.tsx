"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Users, Layers, History, Info } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { name: "ホーム", href: "/", icon: Home },
  { name: "マッチング", href: "/matching", icon: Users, soon: true },
  { name: "デッキ", href: "/decks", icon: Layers },
  { name: "履歴", href: "/history", icon: History },
  { name: "最新情報", href: "/info", icon: Info },
]

export function FooterNavigation() {
  const pathname = usePathname()

  return (
    <footer className="bg-white border-t border-slate-200 shadow-t-sm sticky bottom-0 z-50">
      <nav className="container mx-auto px-2 py-1.5">
        <ul className="flex justify-around items-center">
          {navItems.map((item) => (
            <li key={item.name} className="flex-1">
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center p-1.5 rounded-md text-slate-600 hover:bg-violet-50 hover:text-violet-600 transition-colors group",
                  pathname === item.href && "text-violet-600",
                )}
              >
                <div className="relative">
                  <item.icon className="h-5 w-5 mb-0.5" />
                  {item.soon && (
                    <span className="absolute -top-1 -right-3 bg-amber-400 text-white text-[0.6rem] px-1 py-0.5 rounded-full font-semibold">
                      SOON
                    </span>
                  )}
                </div>
                <span className="text-xs font-medium">{item.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </footer>
  )
}
