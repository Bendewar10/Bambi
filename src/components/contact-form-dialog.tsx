'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { supabase } from '@/lib/supabase'
import {
  Contact,
  CATEGORY_LABELS,
  STRENGTH_LABELS,
  STRENGTH_DEFAULT_INTERVAL_DAYS,
  type Category,
  type Strength,
} from '@/lib/contacts'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

function today() {
  return new Date().toISOString().slice(0, 10)
}

const contactSchema = z.object({
  name: z.string().trim().min(1, 'Name ist erforderlich').max(200, 'Max. 200 Zeichen'),
  category: z.enum(['business', 'investor', 'community', 'friend', 'acquaintance']).optional(),
  strength: z.enum(['1', '2', '3']).optional(),
  context: z.string().trim().max(500, 'Max. 500 Zeichen').optional(),
  notes: z.string().trim().max(2000, 'Max. 2000 Zeichen').optional(),
  city: z.string().trim().max(100, 'Max. 100 Zeichen').optional(),
  phone: z.string().trim().max(30, 'Max. 30 Zeichen').optional(),
  birthday: z
    .string()
    .optional()
    .refine((value) => !value || value <= today(), 'Geburtstag darf nicht in der Zukunft liegen'),
  followup_interval_days: z.string().optional(),
})

type ContactFormValues = z.infer<typeof contactSchema>

interface ContactFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contact?: Contact | null
  onSaved: () => void
}

export function ContactFormDialog({ open, onOpenChange, contact, onSaved }: ContactFormDialogProps) {
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: '',
      category: undefined,
      strength: undefined,
      context: '',
      notes: '',
      city: '',
      phone: '',
      birthday: '',
      followup_interval_days: '',
    },
  })

  useEffect(() => {
    if (open) {
      setSubmitError(null)
      form.reset({
        name: contact?.name ?? '',
        category: (contact?.category as Category) ?? undefined,
        strength: contact?.strength ? (String(contact.strength) as '1' | '2' | '3') : undefined,
        context: contact?.context ?? '',
        notes: contact?.notes ?? '',
        city: contact?.city ?? '',
        phone: contact?.phone ?? '',
        birthday: contact?.birthday ?? '',
        followup_interval_days: contact?.followup_interval_days
          ? String(contact.followup_interval_days)
          : '',
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, contact])

  function handleStrengthChange(value: string) {
    form.setValue('strength', value as '1' | '2' | '3')
    if (!form.formState.dirtyFields.followup_interval_days) {
      const days = STRENGTH_DEFAULT_INTERVAL_DAYS[Number(value) as Strength]
      form.setValue('followup_interval_days', String(days))
    }
  }

  async function onSubmit(values: ContactFormValues) {
    setSubmitError(null)
    setIsSubmitting(true)

    try {
      const payload = {
        name: values.name,
        category: values.category ?? null,
        strength: values.strength ? Number(values.strength) : null,
        context: values.context || null,
        notes: values.notes || null,
        city: values.city || null,
        phone: values.phone || null,
        birthday: values.birthday || null,
        followup_interval_days: values.followup_interval_days
          ? Number(values.followup_interval_days)
          : null,
      }

      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) {
        setSubmitError('Nicht eingeloggt.')
        return
      }

      const { error, status } = contact
        ? await supabase.from('contacts').update(payload).eq('id', contact.id)
        : await supabase.from('contacts').insert({ ...payload, user_id: userData.user.id })

      if (error && status === 0) {
        setSubmitError('Verbindung zu Supabase fehlgeschlagen. Bitte erneut versuchen.')
        return
      }

      if (error) {
        setSubmitError('Speichern fehlgeschlagen. Bitte erneut versuchen.')
        return
      }

      onOpenChange(false)
      onSaved()
    } catch {
      setSubmitError('Verbindung zu Supabase fehlgeschlagen. Bitte erneut versuchen.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{contact ? 'Kontakt bearbeiten' : 'Kontakt hinzufügen'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {submitError && (
              <Alert variant="destructive">
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            )}

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kategorie</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Kategorie wählen" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="strength"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Beziehungsstärke</FormLabel>
                  <Select onValueChange={handleStrengthChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Stärke wählen" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(STRENGTH_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="context"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kontext</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notizen</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stadt</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefonnummer</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="birthday"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Geburtstag</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="followup_interval_days"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Follow-up-Intervall (Tage)</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Abbrechen
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Wird gespeichert...' : 'Speichern'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
