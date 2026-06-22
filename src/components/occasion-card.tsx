'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ContactOccasion } from '@/lib/occasions'
import { buildCalendarLink, buildWhatsAppLink } from '@/lib/external-links'

const BADGE_LABELS = {
  followup: 'Follow-up',
  birthday: 'Geburtstag',
} as const

interface OccasionCardProps {
  occasion: ContactOccasion
  onLogInteraction: () => void
}

export function OccasionCard({ occasion, onLogInteraction }: OccasionCardProps) {
  const { contact, badges, followupDate, birthdayDate } = occasion
  const [draftText, setDraftText] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [draftError, setDraftError] = useState<string | null>(null)

  const primaryType = badges[0]

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
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
        <CardTitle className="truncate text-base">{contact.name}</CardTitle>
        <div className="flex shrink-0 gap-1">
          {badges.map((badge) => (
            <Badge key={badge} variant="secondary">
              {BADGE_LABELS[badge]}
            </Badge>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={onLogInteraction}>
            Kontaktiert
          </Button>
          <Button size="sm" variant="outline" onClick={handleGenerateDraft} disabled={isGenerating}>
            {isGenerating ? 'Generiere...' : 'Vorschlag'}
          </Button>
          {badges.includes('followup') && followupDate && (
            <Button size="sm" variant="ghost" asChild>
              <a
                href={buildCalendarLink(`Follow-up: ${contact.name}`, followupDate)}
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
                href={buildCalendarLink(`Geburtstag: ${contact.name}`, birthdayDate)}
                target="_blank"
                rel="noopener noreferrer"
              >
                Zum Kalender (Geburtstag)
              </a>
            </Button>
          )}
        </div>

        {draftError && <p className="text-destructive">{draftError}</p>}

        {!contact.phone && (
          <p className="text-xs text-muted-foreground">Keine Telefonnummer hinterlegt</p>
        )}

        {draftText && (
          <div className="space-y-2 rounded-md border p-2">
            <p className="text-muted-foreground">{draftText}</p>
            {contact.phone && (
              <Button size="sm" asChild>
                <a
                  href={buildWhatsAppLink(contact.phone, draftText)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Per WhatsApp senden
                </a>
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
