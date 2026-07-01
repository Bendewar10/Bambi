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

  const totalDue = todaySection.length
  const totalUpcoming = upcomingSection.length
  const totalEvents = eventGroups.length

  return (
    <div className="w-full max-w-5xl space-y-8">
      <PageHeader title="Dashboard" description="Fällige Follow-ups und aktuelle Anlässe" />
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Lädt...</p>
      ) : !hasAnyOccasion && totalEvents === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center">
          <p className="text-base font-medium">Alles im Blick</p>
          <p className="mt-1 text-sm text-muted-foreground">Aktuell keine fälligen Follow-ups oder Anlässe.</p>
        </div>
      ) : (
        <>
          {todaySection.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold">Heute & überfällig</h2>
                <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                  {totalDue}
                </span>
              </div>
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
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold">Nächste 14 Tage</h2>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {totalUpcoming}
                </span>
              </div>
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
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold">Kürzlich erkannt</h2>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {totalEvents}
            </span>
          </div>
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
