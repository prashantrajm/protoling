import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { ChevronRight, Play, Smartphone } from 'lucide-react'
import { useState } from 'react'
import { PreviewCard } from '@/components/project/PreviewCard'
import { ProjectsLayout } from '@/components/shell/ProjectsLayout'
import { Button } from '@/components/ui/button'
import { projectBoards } from '@/lib/boards'
import { useEditor } from '@/lib/editor'
import { findProject, useProjectEntry, useWorkspace } from '@/lib/workspace/store'

export const Route = createFileRoute('/_app/p/$project/')({
  beforeLoad: ({ params }) => {
    if (!findProject(useWorkspace.getState().projects, params.project)) throw notFound()
  },
  component: ProjectPage,
})

function ProjectPage() {
  const { project: slug } = Route.useParams()
  const entry = useProjectEntry(slug)
  const openPhone = useEditor((s) => s.setPhoneDialogOpen)
  // Only one card plays at a time.
  const [active, setActive] = useState<string | null>(null)
  const activate = (id: string) => (on: boolean) =>
    setActive((current) => (on ? id : current === id ? null : current))

  if (!entry) return null
  const name = entry.project?.name ?? slug
  const device = entry.project?.device
  const boards = entry.hasApp ? projectBoards(entry) : []

  return (
    <ProjectsLayout>
      {/* One row: where you are and what you can do. The previews say the rest. */}
      <header className="flex items-center justify-between gap-6">
        <nav
          className="flex items-center gap-2 text-[15px] text-muted-foreground"
          aria-label="Breadcrumb"
        >
          <Link to="/" className="hover:text-foreground">
            Projects
          </Link>
          <ChevronRight className="size-4" />
          <h1 className="font-normal text-foreground">{name}</h1>
        </nav>
        {entry.hasApp && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => openPhone(true)}>
              <Smartphone />
              Open on phone
            </Button>
            <Button asChild>
              <Link to="/p/$project/play/$" params={{ project: slug, _splat: '' }}>
                <Play />
                Play
              </Link>
            </Button>
          </div>
        )}
      </header>

      {entry.error && (
        <pre className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          project.json: {entry.error}
        </pre>
      )}

      {!entry.hasApp ? (
        <div className="mt-8 max-w-xl rounded-xl border p-6 text-sm">
          <p className="font-medium">This project has no app yet.</p>
          <p className="mt-1 text-muted-foreground">
            Create <code>projects/{slug}/app/route.tsx</code>. Everything in{' '}
            <code>app/</code> is a TanStack Router file route, mounted at{' '}
            <code>/{slug}</code>.
          </p>
        </div>
      ) : (
        <ul className="mt-8 grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-7">
          <li>
            <PreviewCard
              link={{ to: '/p/$project/play/$', params: { project: slug, _splat: '' } }}
              urls={[`/${slug}`]}
              device={device}
              title="Play"
              subtitle="The whole app, running"
              active={active === 'play'}
              onActivate={activate('play')}
            />
          </li>
          {boards.map((board) => (
            <li key={board.slug}>
              <PreviewCard
                link={{
                  to: '/p/$project/boards/$board',
                  params: { project: slug, board: board.slug },
                }}
                urls={board.frames.slice(0, 3).map((f) => f.url)}
                device={device}
                title={board.name}
                subtitle={board.error ?? `${board.frames.length} screens`}
                active={active === board.slug}
                onActivate={activate(board.slug)}
              />
            </li>
          ))}
        </ul>
      )}
    </ProjectsLayout>
  )
}
