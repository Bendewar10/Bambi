'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ContactOccasion } from '@/lib/occasions'
import { buildCalendarLink } from '@/lib/external-links'
import { getFullName } from '@/lib/contacts'

const BADGE_LABELS = {
  followup: 'Follow-up',
  birthday: 'Geburtstag',
} as const

interface OccasionCardProps {
  occasion: ContactOccasion
  onLogInteraction: () => void
  onOpenCard: () => void
}

function formatDate(value: string | null) {
  if (!value) return null
  return new Date(value).toLocaleDateString('de-DE')
}

export function OccasionCard({ occasion, onLogInteraction, onOpenCard }: OccasionCardProps) {
  const { contact, badges, followupDate, birthdayDate } = occasion
  const [draftText, setDraftText] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [draftError, setDraftError] = useState<string | null>(null)
  const [copyError, setCopyError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const primaryType = badges[0]

  async function handleCopyDraft() {
    if (!draftText) return
    setCopyError(null)
    try {
      await navigator.clipboard.writeText(draftText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopyError('Kopieren nicht möglich. Bitte Text manuell markieren.')
    }
  }

  async function handleGenerateDraft() {
    setIsGenerating(true)
    setDraftError(null)
    try {
      const res = await fetch('/api/draft-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId: contact.id, occasionType: primaryType }),
      })
      if (!res.ok) {
        setDraftError('Vorschlag konnte nicht generiert werden. Bitte erneut versuchen.')
        return
      }
      const data = await res.json()
      setDraftText(data.text)
    } catch {
      setDraftError('Vorschlag konnte nicht generiert werden. Bitte erneut versuchen.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Card className="rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-md">
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
        <CardTitle className="truncate text-base">{getFullName(contact)}</CardTitle>
        <div className="flex shrink-0 gap-1">
          {badges.map((badge) => (
            <Badge key={badge} variant="secondary">
              {BADGE_LABELS[badge]}
            </Badge>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {badges.includes('birthday') && birthdayDate && (
          <p className="text-muted-foreground">Geburtstag: {formatDate(birthdayDate)}</p>
        )}

        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={onOpenCard}>
            Karte öffnen
          </Button>
          <Button size="sm" onClick={onLogInteraction}>
            Kontaktiert
          </Button>
          <Button size="sm" variant="outline" onClick={handleGenerateDraft} disabled={isGenerating}>
            {isGenerating ? 'Generiere...' : 'Vorschlag'}
          </Button>
          {badges.includes('followup') && followupDate && (
            <Button size="sm" variant="ghost" asChild>
              <a
                href={buildCalendarLink(`Follow-up: ${getFullName(contact)}`, followupDate)}
                target="_blank"
                rel="noopener noreferrer"
              >
                Zum Kalender (Follow-up)
              </a>
            </Button>
          )}
          {badges.includes('birthday') && birthdayDate && (
            <Button size="sm" variant="ghost" asChild>
              <a
                href={buildCalendarLink(`Geburtstag: ${getFullName(contact)}`, birthdayDate)}
                target="_blank"
                rel="noopener noreferrer"
              >
                Zum Kalender (Geburtstag)
              </a>
            </Button>
          )}
        </div>

        {draftError && <p className="text-destructive">{draftError}</p>}

        {draftText && (
          <div className="space-y-2 rounded-md border p-2">
            <p className="text-muted-foreground">{draftText}</p>
            <Button size="sm" onClick={handleCopyDraft}>
              {copied ? 'Kopiert!' : 'Kopieren'}
            </Button>
            {copyError && <p className="text-destructive">{copyError}</p>}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
