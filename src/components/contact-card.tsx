'use client'

import { Contact, CATEGORY_LABELS, STRENGTH_LABELS, getFullName } from '@/lib/contacts'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { History, Linkedin, MoreVertical, Sparkles, Trash2 } from 'lucide-react'
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

function getInitials(contact: Contact) {
  const first = contact.first_name?.[0] ?? ''
  const last = contact.last_name?.[0] ?? ''
  return (first + last).toUpperCase() || '?'
}

export function ContactCard({ contact, onEdit, onDelete, onShowHistory }: ContactCardProps) {
  const isOverdue = contact.next_followup_at
    ? new Date(contact.next_followup_at) < new Date()
    : false

  return (
    <Card
      onClick={onEdit}
      className={cn(
        'cursor-pointer rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-md',
        isOverdue && 'border-destructive'
      )}
    >
      <CardHeader className="flex flex-row items-start gap-3 space-y-0 p-4">
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarFallback className="bg-primary/10 text-sm font-medium text-primary">
            {getInitials(contact)}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-base font-semibold leading-tight">{getFullName(contact)}</h3>
          {contact.job_title || contact.employer ? (
            <p className="truncate text-sm text-muted-foreground">
              {[contact.job_title, contact.employer].filter(Boolean).join(' · ')}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {contact.linkedin_url && (
            <Button variant="ghost" size="icon" aria-label="LinkedIn-Profil öffnen" asChild>
              <a
                href={contact.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                <Linkedin className="size-4" />
              </a>
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            aria-label="Verlauf anzeigen"
            onClick={(e) => {
              e.stopPropagation()
              onShowHistory()
            }}
          >
            <History className="size-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Mehr Optionen"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete()
                }}
              >
                <Trash2 className="size-4" />
                Löschen
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-2 p-4 pt-0 text-sm">
        <div className="flex flex-wrap gap-1">
          {contact.category && <Badge variant="secondary">{CATEGORY_LABELS[contact.category]}</Badge>}
          {contact.strength && <Badge variant="outline">{STRENGTH_LABELS[contact.strength]}</Badge>}
          {contact.commonalities && (
            <Badge variant="outline" className="gap-1 border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-950 dark:text-violet-300">
              <Sparkles className="size-3" />
              Gemeinsamkeiten
            </Badge>
          )}
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
