'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Contact } from '@/lib/contacts'
import { parseLinkedInCsv, computeImportPlan, type ImportPlan } from '@/lib/linkedin-import'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface LinkedInImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contacts: Contact[]
  onImported: () => void
}

const BATCH_SIZE = 50

export function LinkedInImportDialog({
  open,
  onOpenChange,
  contacts,
  onImported,
}: LinkedInImportDialogProps) {
  const [plan, setPlan] = useState<ImportPlan | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  function reset() {
    setPlan(null)
    setParseError(null)
    setSubmitError(null)
    setSuccessMessage(null)
  }

  function handleClose(nextOpen: boolean) {
    if (!nextOpen) reset()
    onOpenChange(nextOpen)
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    reset()
    const text = await file.text()
    const result = parseLinkedInCsv(text)
    if (!result) {
      setParseError('Keine gültige LinkedIn-Export-Datei.')
      return
    }
    setPlan(computeImportPlan(result, contacts))
  }

  async function handleImport() {
    if (!plan) return
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) {
        setSubmitError('Nicht eingeloggt.')
        return
      }

      for (let i = 0; i < plan.newContacts.length; i += BATCH_SIZE) {
        const batch = plan.newContacts
          .slice(i, i + BATCH_SIZE)
          .map((row) => ({ ...row, user_id: userData.user.id }))
        const { error } = await supabase.from('contacts').insert(batch)
        if (error) throw error
      }

      for (const update of plan.updates) {
        const { error } = await supabase
          .from('contacts')
          .update(update.changes)
          .eq('id', update.contactId)
        if (error) throw error
      }

      setSuccessMessage(
        `${plan.newContacts.length} neu, ${plan.updates.length} aktualisiert, ${plan.unchangedCount} unverändert, ${plan.skippedCount} übersprungen.`
      )
      setPlan(null)
      onImported()
    } catch {
      setSubmitError('Import fehlgeschlagen. Bitte erneut versuchen.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>LinkedIn-Kontakte importieren</DialogTitle>
        </DialogHeader>

        {!plan && !successMessage && (
          <div className="space-y-4">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              aria-label="LinkedIn-CSV-Datei"
              className="text-sm"
            />
            {parseError && (
              <Alert variant="destructive">
                <AlertDescription>{parseError}</AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {plan && (
          <div className="space-y-2 text-sm">
            <p>{plan.newContacts.length} neue Kontakte</p>
            <p>{plan.updates.length} werden aktualisiert</p>
            <p>{plan.unchangedCount} unverändert</p>
            <p>{plan.skippedCount} übersprungen (kein Vorname)</p>
            {submitError && (
              <Alert variant="destructive">
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {successMessage && <p className="text-sm">{successMessage}</p>}

        <DialogFooter>
          {plan ? (
            <>
              <Button type="button" variant="outline" onClick={() => handleClose(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleImport} disabled={isSubmitting}>
                {isSubmitting ? 'Importiere...' : 'Importieren'}
              </Button>
            </>
          ) : (
            <Button type="button" variant="outline" onClick={() => handleClose(false)}>
              Schließen
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
