'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  EducationEntry,
  EmploymentEntry,
  UserProfile,
  formatEntryDateRange,
  sortByStartDateDesc,
} from '@/lib/user-profile'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Trash2 } from 'lucide-react'
import { EducationFormDialog } from '@/components/education-form-dialog'
import { EmploymentFormDialog } from '@/components/employment-form-dialog'
import { CvUploadDialog } from '@/components/cv-upload-dialog'

export function CvProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [education, setEducation] = useState<EducationEntry[]>([])
  const [employment, setEmployment] = useState<EmploymentEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [educationDialogOpen, setEducationDialogOpen] = useState(false)
  const [employmentDialogOpen, setEmploymentDialogOpen] = useState(false)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [editingEducation, setEditingEducation] = useState<EducationEntry | null>(null)
  const [editingEmployment, setEditingEmployment] = useState<EmploymentEntry | null>(null)

  function loadProfile() {
    return supabase
      .from('user_profile')
      .select('*')
      .maybeSingle()
      .then(({ data }) => setProfile(data ?? null))
  }

  function loadEducation() {
    return supabase
      .from('user_education')
      .select('*')
      .then(({ data }) => setEducation((data as EducationEntry[]) ?? []))
  }

  function loadEmployment() {
    return supabase
      .from('user_employment')
      .select('*')
      .then(({ data }) => setEmployment((data as EmploymentEntry[]) ?? []))
  }

  function loadAll() {
    return Promise.all([loadProfile(), loadEducation(), loadEmployment()])
  }

  useEffect(() => {
    void loadAll().then(() => setIsLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function deleteEducation(id: string) {
    await supabase.from('user_education').delete().eq('id', id)
    loadEducation()
  }

  async function deleteEmployment(id: string) {
    await supabase.from('user_employment').delete().eq('id', id)
    loadEmployment()
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">Lädt...</p>

  const hasAnyData = !!profile || education.length > 0 || employment.length > 0
  const sortedEducation = sortByStartDateDesc(education)
  const sortedEmployment = sortByStartDateDesc(employment)

  if (!hasAnyData) {
    return (
      <div className="w-full max-w-4xl space-y-4">
        <h1 className="text-xl font-semibold">Mein Lebenslauf</h1>
        <div className="space-y-3 py-8 text-center">
          <p className="text-sm text-muted-foreground">
            Noch kein Profil angelegt. Lade deinen Lebenslauf hoch oder trage Stationen manuell ein.
          </p>
          <div className="flex justify-center gap-2">
            <Button onClick={() => setUploadDialogOpen(true)}>CV hochladen</Button>
            <Button variant="outline" onClick={() => setEducationDialogOpen(true)}>
              Manuell hinzufügen
            </Button>
          </div>
        </div>

        <CvUploadDialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen} onSaved={loadAll} />
        <EducationFormDialog
          open={educationDialogOpen}
          onOpenChange={setEducationDialogOpen}
          entry={null}
          onSaved={loadEducation}
        />
      </div>
    )
  }

  return (
    <div className="w-full max-w-4xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold">Mein Lebenslauf</h1>
          {profile?.headline && <p className="text-sm text-muted-foreground">{profile.headline}</p>}
        </div>
        <Button onClick={() => setUploadDialogOpen(true)}>CV hochladen</Button>
      </div>

      {(profile?.skills.length || profile?.languages.length) ? (
        <div className="space-y-2">
          {profile.skills.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {profile.skills.map((skill) => (
                <Badge key={skill} variant="secondary">
                  {skill}
                </Badge>
              ))}
            </div>
          )}
          {profile.languages.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {profile.languages.map((language) => (
                <Badge key={language} variant="outline">
                  {language}
                </Badge>
              ))}
            </div>
          )}
        </div>
      ) : null}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Ausbildung</h2>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setEditingEducation(null)
              setEducationDialogOpen(true)
            }}
          >
            + Ausbildung hinzufügen
          </Button>
        </div>

        {sortedEducation.length === 0 ? (
          <p className="text-sm text-muted-foreground">Noch keine Ausbildung hinterlegt.</p>
        ) : (
          <div className="space-y-2">
            {sortedEducation.map((entry) => (
              <div key={entry.id} className="flex items-start justify-between gap-2 rounded-md border p-3">
                <div
                  className="flex-1 cursor-pointer space-y-0.5"
                  onClick={() => {
                    setEditingEducation(entry)
                    setEducationDialogOpen(true)
                  }}
                >
                  <p className="text-sm font-medium">{entry.institution}</p>
                  {(entry.degree || entry.field_of_study) && (
                    <p className="text-sm text-muted-foreground">
                      {[entry.degree, entry.field_of_study].filter(Boolean).join(' · ')}
                    </p>
                  )}
                  {formatEntryDateRange(entry.start_date, entry.end_date) && (
                    <p className="text-xs text-muted-foreground">
                      {formatEntryDateRange(entry.start_date, entry.end_date)}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Ausbildung löschen"
                  onClick={() => deleteEducation(entry.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Berufserfahrung</h2>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setEditingEmployment(null)
              setEmploymentDialogOpen(true)
            }}
          >
            + Berufserfahrung hinzufügen
          </Button>
        </div>

        {sortedEmployment.length === 0 ? (
          <p className="text-sm text-muted-foreground">Noch keine Berufserfahrung hinterlegt.</p>
        ) : (
          <div className="space-y-2">
            {sortedEmployment.map((entry) => (
              <div key={entry.id} className="flex items-start justify-between gap-2 rounded-md border p-3">
                <div
                  className="flex-1 cursor-pointer space-y-0.5"
                  onClick={() => {
                    setEditingEmployment(entry)
                    setEmploymentDialogOpen(true)
                  }}
                >
                  <p className="text-sm font-medium">{entry.employer}</p>
                  {entry.job_title && <p className="text-sm text-muted-foreground">{entry.job_title}</p>}
                  {formatEntryDateRange(entry.start_date, entry.end_date) && (
                    <p className="text-xs text-muted-foreground">
                      {formatEntryDateRange(entry.start_date, entry.end_date)}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Berufserfahrung löschen"
                  onClick={() => deleteEmployment(entry.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <CvUploadDialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen} onSaved={loadAll} />
      <EducationFormDialog
        open={educationDialogOpen}
        onOpenChange={setEducationDialogOpen}
        entry={editingEducation}
        onSaved={loadEducation}
      />
      <EmploymentFormDialog
        open={employmentDialogOpen}
        onOpenChange={setEmploymentDialogOpen}
        entry={editingEmployment}
        onSaved={loadEmployment}
      />
    </div>
  )
}
