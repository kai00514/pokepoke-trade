import Image from "next/image"
import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Heart, Star, Eye, CalendarDays } from "lucide-react"

export interface Deck {
  id: string
  name: string
  imageUrl: string
  updatedAt: string
  likes: number
  favorites: number
  views: number
  cardName?: string // Optional: if the main card name is different from deck name
}

interface DeckCardProps {
  deck: Deck
}

export default function DeckCard({ deck }: DeckCardProps) {
  return (
    <Link href={`/decks/${deck.id}`} className="block group">
      <Card className="h-full overflow-hidden transition-all duration-200 ease-in-out group-hover:shadow-xl group-hover:-translate-y-1 bg-white">
        <CardHeader className="p-4">
          <CardTitle className="text-purple-600 text-lg font-bold truncate group-hover:text-purple-700">
            {deck.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 flex flex-col items-center">
          <div className="relative w-full aspect-[5/7] mb-3">
            {" "}
            {/* Standard card aspect ratio */}
            <Image
              src={deck.imageUrl || "/placeholder.svg"}
              alt={deck.cardName || deck.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-contain rounded-md border border-slate-200 bg-slate-50"
            />
          </div>
          <p className="text-sm text-slate-700 font-medium truncate w-full text-center">{deck.cardName || deck.name}</p>
          <div className="flex items-center text-xs text-slate-500 mt-1">
            <CalendarDays className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
            <span>更新日: {deck.updatedAt}</span>
          </div>
        </CardContent>
        <CardFooter className="p-3 bg-slate-50/70 border-t border-slate-200/80 flex justify-around items-center text-xs text-slate-600">
          <div className="flex items-center" title="いいね">
            <Heart className="h-3.5 w-3.5 mr-1 text-pink-500" />
            <span>{deck.likes}</span>
          </div>
          <div className="flex items-center" title="お気に入り">
            <Star className="h-3.5 w-3.5 mr-1 text-amber-500" />
            <span>{deck.favorites}</span>
          </div>
          <div className="flex items-center" title="閲覧数">
            <Eye className="h-3.5 w-3.5 mr-1 text-sky-500" />
            <span>{deck.views}</span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  )
}
