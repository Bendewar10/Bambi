'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ContactEventGroup } from '@/lib/contact-events'
import { getFullName } from '@/lib/contacts'

interface ImportEventCardProps {
  group: ContactEventGroup
  onLogInteraction: () => void
}

export function ImportEventCard({ group, onLogInteraction }: ImportEventCardProps) {
  const { contact, types } = group
  const [draftText, setDraftText] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [draftError, setDraftError] = useState<string | null>(null)
  const [copyError, setCopyError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const primaryType = types[0]

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
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
        <CardTitle className="truncate text-base">{getFullName(contact)}</CardTitle>
        <div className="flex shrink-0 gap-1">
          {types.map((type) => (
            <Badge key={type} variant="secondary">
              {type}
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
