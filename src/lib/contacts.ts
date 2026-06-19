export type Category = 'business' | 'investor' | 'community' | 'friend' | 'acquaintance'
export type Strength = 1 | 2 | 3

export const CATEGORY_LABELS: Record<Category, string> = {
  business: 'Business',
  investor: 'Investor',
  community: 'Community',
  friend: 'Freund',
  acquaintance: 'Bekannter',
}

export const STRENGTH_LABELS: Record<Strength, string> = {
  1: 'Kern',
  2: 'Mittel',
  3: 'Locker',
}

export const STRENGTH_DEFAULT_INTERVAL_DAYS: Record<Strength, number> = {
  1: 14,
  2: 30,
  3: 90,
}

export interface Contact {
  id: string
  name: string
  category: Category | null
  strength: Strength | null
  context: string | null
  notes: string | null
  followup_interval_days: number | null
  last_contacted_at: string | null
  next_followup_at: string | null
  created_at: string
}
