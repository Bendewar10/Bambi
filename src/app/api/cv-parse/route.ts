import { anthropic } from '@ai-sdk/anthropic'
import { generateObject } from 'ai'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createSupabaseServerClient } from '@/lib/supabase-server'

const requestSchema = z.object({
  storagePath: z.string().min(1),
})

const educationSchema = z.object({
  institution: z.string(),
  degree: z.string().nullable(),
  field_of_study: z.string().nullable(),
  city: z.string().nullable(),
  start_date: z.string().nullable(),
  end_date: z.string().nullable(),
})

const employmentSchema = z.object({
  employer: z.string(),
  job_title: z.string().nullable(),
  city: z.string().nullable(),
  start_date: z.string().nullable(),
  end_date: z.string().nullable(),
  description: z.string().nullable(),
})

const cvSchema = z.object({
  headline: z.string().nullable(),
  education: z.array(educationSchema),
  employment: z.array(employmentSchema),
  skills: z.array(z.string()),
  languages: z.array(z.string()),
})

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) {
    return NextResponse.json({ error: 'Nicht eingeloggt.' }, { status: 401 })
  }

  const parsed = requestSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 })
  }
  const { storagePath } = parsed.data

  const { data: file, error: downloadError } = await supabase.storage.from('cv-uploads').download(storagePath)
  if (downloadError || !file) {
    return NextResponse.json({ error: 'Datei nicht gefunden.' }, { status: 404 })
  }

  const base64Pdf = Buffer.from(await file.arrayBuffer()).toString('base64')

  try {
    const { object } = await generateObject({
      model: anthropic('claude-sonnet-4-6'),
      schema: cvSchema,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extrahiere die strukturierten Lebenslauf-Daten aus diesem PDF auf Deutsch: Kurzbeschreibung/Headline, Ausbildung (Institution, Abschluss, Fachrichtung, Stadt, Zeitraum), Berufserfahrung (Arbeitgeber, Rolle, Stadt, Zeitraum, kurze Beschreibung), Skills und Sprachen. Daten, Felder ohne Information als null, Listen ohne erkennbare Einträge als leeres Array.',
            },
            { type: 'file', data: base64Pdf, mediaType: 'application/pdf' },
          ],
        },
      ],
    })

    return NextResponse.json(object)
  } catch {
    return NextResponse.json({ error: 'Lebenslauf konnte nicht ausgelesen werden.' }, { status: 502 })
  }
}
