'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Contact } from '@/lib/contacts'
import { computeOccasionSections } from '@/lib/occasions'
import { ContactEvent, groupOpenEvents } from '@/lib/contact-events'
import { OccasionCard } from '@/components/occasion-card'
import { ImportEventCard } from '@/components/import-event-card'
import { InteractionFormDialog } from '@/components/interaction-form-dialog'
import { ContactFormDialog } from '@/components/contact-form-dialog'
import { PageHeader } from '@/components/page-header'

export default function DashboardPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [events, setEvents] = useState<ContactEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loggingContact, setLoggingContact] = useState<Contact | null>(null)
  const [dismissingEventIds, setDismissingEventIds] = useState<string[] | null>(null)
  const [openCardContact, setOpenCardContact] = useState<Contact | null>(null)

  function loadContacts() {
    return supabase
      .from('contacts')
      .select('*')
      .then(({ data }) => {
        setContacts(data ?? [])
        setIsLoading(false)
      })
  }

  function loadEvents() {
    return supabase
      .from('contact_events')
      .select('*')
      .then(({ data, error }) => {
        setEvents(error ? [] : data ?? [])
      })
  }

  useEffect(() => {
    void loadContacts()
    void loadEvents()
  }, [])

  const { todaySection, upcomingSection } = useMemo(() => computeOccasionSections(contacts), [contacts])
  const eventGroups = useMemo(() => groupOpenEvents(events, contacts), [events, contacts])

  const hasAnyOccasion = todaySection.length > 0 || upcomingSection.length > 0

  function openInteractionForOccasion(contact: Contact) {
    setDismissingEventIds(null)
    setLoggingContact(contact)
  }

  function openInteractionForEventGroup(group: { contact: Contact; events: ContactEvent[] }) {
    setDismissingEventIds(group.events.map((e) => e.id))
    setLoggingContact(group.contact)
  }

  async function handleInteractionSaved() {
    setLoggingContact(null)
    if (dismissingEventIds) {
      await supabase
        .from('contact_events')
        .update({ dismissed_at: new Date().toISOString() })
        .in('id', dismissingEventIds)
      setDismissingEventIds(null)
    }
    loadContacts()
    loadEvents()
  }

  return (
    <div className="w-full max-w-5xl space-y-8">
      <PageHeader title="Dashboard" description="Fällige Follow-ups und aktuelle Anlässe" />
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Lädt...</p>
      ) : !hasAnyOccasion ? (
        <p className="text-sm text-muted-foreground">Alles im Blick — aktuell nichts Fälliges.</p>
      ) : (
        <>
          {todaySection.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold">Heute & überfällig</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {todaySection.map((occasion) => (
                  <OccasionCard
                    key={occasion.contact.id}
                    occasion={occasion}
                    onLogInteraction={() => openInteractionForOccasion(occasion.contact)}
                    onOpenCard={() => setOpenCardContact(occasion.contact)}
                  />
                ))}
              </div>
            </section>
          )}

          {upcomingSection.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold">Nächste 14 Tage</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {upcomingSection.map((occasion) => (
                  <OccasionCard
                    key={occasion.contact.id}
                    occasion={occasion}
                    onLogInteraction={() => openInteractionForOccasion(occasion.contact)}
                    onOpenCard={() => setOpenCardContact(occasion.contact)}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {eventGroups.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Kürzlich erkannt</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {eventGroups.map((group) => (
              <ImportEventCard
                key={group.contact.id}
                group={group}
                onLogInteraction={() => openInteractionForEventGroup(group)}
              />
            ))}
          </div>
        </section>
      )}

      {loggingContact && (
        <InteractionFormDialog
          open={!!loggingContact}
          onOpenChange={(open) => !open && setLoggingContact(null)}
          contactId={loggingContact.id}
          interaction={null}
          onSaved={handleInteractionSaved}
        />
      )}

      <ContactFormDialog
        open={!!openCardContact}
        onOpenChange={(open) => !open && setOpenCardContact(null)}
        contact={openCardContact}
        onSaved={() => {
          setOpenCardContact(null)
          loadContacts()
        }}
      />
    </div>
  )
}
