'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Project } from '@/lib/projects'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProjectCard, type ProjectCardParticipant } from '@/components/project-card'
import { ProjectFormDialog } from '@/components/project-form-dialog'

interface ProjectRow extends Project {
  project_participants: ProjectCardParticipant[]
}

export function ProjectList() {
  const [projects, setProjects] = useState<ProjectRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [tab, setTab] = useState<'active' | 'done'>('active')

  function loadProjects() {
    return supabase
      .from('projects')
      .select('*, project_participants(id, contact:contacts(id, first_name, last_name))')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setProjects((data as ProjectRow[]) ?? [])
        setIsLoading(false)
      })
  }

  useEffect(() => {
    void loadProjects()
  }, [])

  const activeProjects = useMemo(() => projects.filter((p) => p.status === 'active'), [projects])
  const doneProjects = useMemo(() => projects.filter((p) => p.status === 'done'), [projects])
  const hasAnyProjects = projects.length > 0

  function renderList(list: ProjectRow[]) {
    if (isLoading) return <p className="text-sm text-muted-foreground">Lädt...</p>
    if (!hasAnyProjects)
      return (
        <div className="space-y-3 py-8 text-center">
          <p className="text-sm text-muted-foreground">Noch keine Projekte. Lege oben dein erstes Projekt an.</p>
        </div>
      )
    if (list.length === 0)
      return <p className="text-sm text-muted-foreground">Keine Projekte in dieser Ansicht.</p>

    return (
      <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(300px,1fr))]">
        {list.map((project) => (
          <ProjectCard key={project.id} project={project} participants={project.project_participants} />
        ))}
      </div>
    )
  }

  return (
    <div className="w-full max-w-6xl space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Tabs value={tab} onValueChange={(value) => setTab(value as 'active' | 'done')}>
          <TabsList>
            <TabsTrigger value="active">Aktiv</TabsTrigger>
            <TabsTrigger value="done">Beendet</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button onClick={() => setFormOpen(true)}>Projekt anlegen</Button>
      </div>

      {tab === 'active' ? renderList(activeProjects) : renderList(doneProjects)}

      <ProjectFormDialog open={formOpen} onOpenChange={setFormOpen} onSaved={loadProjects} />
    </div>
  )
}
