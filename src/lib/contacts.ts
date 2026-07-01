export type Category = 'business' | 'investor' | 'community' | 'friend' | 'acquaintance' | 'random'
export type Strength = 1 | 2 | 3

export const CATEGORY_LABELS: Record<Category, string> = {
  business: 'Work',
  investor: 'Investor',
  community: 'Community',
  friend: 'Freund',
  acquaintance: 'Bekannter',
  random: 'Random',
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
  first_name: string
  last_name: string | null
  category: Category | null
  strength: Strength | null
  employer: string | null
  job_title: string | null
  email: string | null
  linkedin_url: string | null
  context: string | null
  notes: string | null
  city: string | null
  phone: string | null
  birthday: string | null
  followup_interval_days: number | null
  last_contacted_at: string | null
  next_followup_at: string | null
  commonalities?: string | null
  created_at: string
}

export function getFullName(contact: Pick<Contact, 'first_name' | 'last_name'>) {
  return contact.last_name ? `${contact.first_name} ${contact.last_name}` : contact.first_name
}
