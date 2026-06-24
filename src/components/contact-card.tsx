'use client'

import { Contact, CATEGORY_LABELS, STRENGTH_LABELS, getFullName } from '@/lib/contacts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { History } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ContactCardProps {
  contact: Contact
  onEdit: () => void
  onDelete: () => void
  onShowHistory: () => void
}

function formatDate(value: string | null) {
  if (!value) return null
  return new Date(value).toLocaleDateString('de-DE')
}

export function ContactCard({ contact, onEdit, onDelete, onShowHistory }: ContactCardProps) {
  const isOverdue = contact.next_followup_at
    ? new Date(contact.next_followup_at) < new Date()
    : false

  return (
    <Card
      onClick={onEdit}
      className={cn(
        'cursor-pointer transition-colors hover:bg-accent',
        isOverdue && 'border-destructive'
      )}
    >
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
        <CardTitle className="truncate text-base">{getFullName(contact)}</CardTitle>
        <div className="flex shrink-0 gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Verlauf"
            onClick={(e) => {
              e.stopPropagation()
              onShowHistory()
            }}
          >
            <History className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
          >
            Löschen
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex flex-wrap gap-1">
          {contact.category && <Badge variant="secondary">{CATEGORY_LABELS[contact.category]}</Badge>}
          {contact.strength && <Badge variant="outline">{STRENGTH_LABELS[contact.strength]}</Badge>}
        </div>
        {contact.last_contacted_at && (
          <p className="text-muted-foreground">
            Letzter Kontakt: {formatDate(contact.last_contacted_at)}
          </p>
        )}
        {contact.next_followup_at && (
          <p className={cn(isOverdue ? 'font-medium text-destructive' : 'text-muted-foreground')}>
            Nächstes Follow-up: {formatDate(contact.next_followup_at)}
            {isOverdue && ' (überfällig)'}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
