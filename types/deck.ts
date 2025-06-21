export interface DeckCard {
  id: string
  name: string
  imageUrl?: string
  count: number
  packName?: string
}

export interface DeckStats {
  accessibility: number
  speed: number
  power: number
  durability: number
  stability: number
}

export interface TierInfo {
  rank: string
  tier: string
  descriptions: string[]
}

export interface StrengthWeakness {
  title: string
  description: string
  images?: string[]
}

export interface HowToPlayStep {
  title: string
  description: string
  images?: string[]
}

export interface DeckData {
  id: string
  title: string
  lastUpdated: string
  commentCount: number
  thumbnailImage?: string
  thumbnailAlt: string
  deckBadge: string
  section1Title: string
  section2Title: string
  section3Title: string
  deckName: string
  energyType: string
  energyImage?: string
  cards: DeckCard[]
  deckDescription: string
  evaluationTitle: string
  tierInfo: TierInfo
  deckStats: DeckStats
  strengthsWeaknessesList: string[]
  strengthsWeaknessesDetails: StrengthWeakness[]
  howToPlayList: string[]
  howToPlaySteps: HowToPlayStep[]
}
