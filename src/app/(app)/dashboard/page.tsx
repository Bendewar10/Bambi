'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Contact } from '@/lib/contacts'
import { computeOccasionSections } from '@/lib/occasions'
import { OccasionCard } from '@/components/occasion-card'
import { InteractionFormDialog } from '@/components/interaction-form-dialog'
import { ContactFormDialog } from '@/components/contact-form-dialog'

export default function DashboardPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loggingContact, setLoggingContact] = useState<Contact | null>(null)
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

  useEffect(() => {
    void loadContacts()
  }, [])

  const { todaySection, weekSection } = useMemo(() => computeOccasionSections(contacts), [contacts])

  const hasAnyOccasion = todaySection.length > 0 || weekSection.length > 0

  return (
    <div className="w-full max-w-4xl space-y-8">
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
                    onLogInteraction={() => setLoggingContact(occasion.contact)}
                    onOpenCard={() => setOpenCardContact(occasion.contact)}
                  />
                ))}
              </div>
            </section>
          )}

          {weekSection.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold">Diese Woche</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {weekSection.map((occasion) => (
                  <OccasionCard
                    key={occasion.contact.id}
                    occasion={occasion}
                    onLogInteraction={() => setLoggingContact(occasion.contact)}
                    onOpenCard={() => setOpenCardContact(occasion.contact)}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {loggingContact && (
        <InteractionFormDialog
          open={!!loggingContact}
          onOpenChange={(open) => !open && setLoggingContact(null)}
          contactId={loggingContact.id}
          interaction={null}
          onSaved={() => {
            setLoggingContact(null)
            loadContacts()
          }}
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
