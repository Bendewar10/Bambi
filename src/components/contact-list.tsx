'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Contact } from '@/lib/contacts'
import { Button } from '@/components/ui/button'
import { ContactFormDialog } from '@/components/contact-form-dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export function ContactList() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [deletingContact, setDeletingContact] = useState<Contact | null>(null)

  function loadContacts() {
    return supabase
      .from('contacts')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setContacts(data ?? [])
        setIsLoading(false)
      })
  }

  useEffect(() => {
    void loadContacts()
  }, [])

  function openCreate() {
    setEditingContact(null)
    setFormOpen(true)
  }

  function openEdit(contact: Contact) {
    setEditingContact(contact)
    setFormOpen(true)
  }

  async function confirmDelete() {
    if (!deletingContact) return
    await supabase.from('contacts').delete().eq('id', deletingContact.id)
    setDeletingContact(null)
    loadContacts()
  }

  return (
    <div className="w-full max-w-md space-y-4">
      <Button onClick={openCreate} className="w-full">
        Kontakt hinzufügen
      </Button>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Lädt...</p>
      ) : contacts.length === 0 ? (
        <p className="text-sm text-muted-foreground">Noch keine Kontakte.</p>
      ) : (
        <ul className="space-y-2">
          {contacts.map((contact) => (
            <li
              key={contact.id}
              className="flex items-center justify-between rounded-md border p-2"
            >
              <span>{contact.name}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => openEdit(contact)}>
                  Bearbeiten
                </Button>
                <Button variant="destructive" size="sm" onClick={() => setDeletingContact(contact)}>
                  Löschen
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ContactFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        contact={editingContact}
        onSaved={loadContacts}
      />

      <AlertDialog open={!!deletingContact} onOpenChange={(open) => !open && setDeletingContact(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kontakt löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingContact?.name} wird unwiderruflich gelöscht.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Löschen</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
