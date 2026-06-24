import Papa from 'papaparse'
import { Contact } from './contacts'

const HEADER_PREFIX = 'First Name,Last Name,URL'

const FIELDS = ['first_name', 'last_name', 'linkedin_url', 'email', 'employer', 'job_title'] as const

export interface ParsedRow {
  first_name: string
  last_name: string | null
  linkedin_url: string | null
  email: string | null
  employer: string | null
  job_title: string | null
}

export interface ParseResult {
  rows: ParsedRow[]
  skippedCount: number
}

export function parseLinkedInCsv(text: string): ParseResult | null {
  const lines = text.split(/\r?\n/)
  const headerIndex = lines.findIndex((line) => line.startsWith(HEADER_PREFIX))
  if (headerIndex === -1) return null

  const csvBody = lines.slice(headerIndex).join('\n')
  const parsed = Papa.parse<Record<string, string>>(csvBody, {
    header: true,
    skipEmptyLines: true,
  })

  const rows: ParsedRow[] = []
  let skippedCount = 0

  for (const record of parsed.data) {
    const firstName = (record['First Name'] ?? '').trim()
    if (!firstName) {
      skippedCount += 1
      continue
    }
    rows.push({
      first_name: firstName,
      last_name: (record['Last Name'] ?? '').trim() || null,
      linkedin_url: (record['URL'] ?? '').trim() || null,
      email: (record['Email Address'] ?? '').trim() || null,
      employer: (record['Company'] ?? '').trim() || null,
      job_title: (record['Position'] ?? '').trim() || null,
    })
  }

  return { rows, skippedCount }
}

export interface ContactUpdate {
  contactId: string
  changes: Partial<Pick<Contact, (typeof FIELDS)[number]>>
}

export type NewContact = ParsedRow

export interface ImportPlan {
  newContacts: NewContact[]
  updates: ContactUpdate[]
  unchangedCount: number
  skippedCount: number
}

export function computeImportPlan(parseResult: ParseResult, existingContacts: Contact[]): ImportPlan {
  const newContacts: NewContact[] = []
  const updates: ContactUpdate[] = []
  let unchangedCount = 0
  const usedNameFallbackIds = new Set<string>()

  for (const row of parseResult.rows) {
    let match: Contact | undefined

    if (row.linkedin_url) {
      match = existingContacts.find((c) => c.linkedin_url === row.linkedin_url)
    }
    if (!match) {
      const rowFirst = row.first_name.toLowerCase()
      const rowLast = (row.last_name ?? '').toLowerCase()
      match = existingContacts.find(
        (c) =>
          !c.linkedin_url &&
          !usedNameFallbackIds.has(c.id) &&
          c.first_name.toLowerCase() === rowFirst &&
          (c.last_name ?? '').toLowerCase() === rowLast
      )
      if (match) usedNameFallbackIds.add(match.id)
    }

    if (!match) {
      newContacts.push(row)
      continue
    }

    const changes: ContactUpdate['changes'] = {}
    for (const field of FIELDS) {
      const newValue = row[field]
      if (newValue && newValue !== match[field]) {
        changes[field] = newValue
      }
    }

    if (Object.keys(changes).length > 0) {
      updates.push({ contactId: match.id, changes })
    } else {
      unchangedCount += 1
    }
  }

  return { newContacts, updates, unchangedCount, skippedCount: parseResult.skippedCount }
}
