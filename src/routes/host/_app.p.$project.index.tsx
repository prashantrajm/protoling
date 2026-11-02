import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { CanvasCard } from '@/components/project/CanvasCard'
import { ProjectsLayout } from '@/components/shell/ProjectsLayout'
import { prefersReducedMotion } from '@/lib/editor'
import { findProject, useProject, useWorkspace } from '@/lib/workspace/store'

export const Route = createFileRoute('/_app/p/$project/')({
  beforeLoad: ({ params }) => {
    if (!findProject(useWorkspace.getState().projects, params.project)) throw notFound()
  },
  component: ProjectPage,
})

function ProjectPage() {
  const { project: slug } = Route.useParams()
  const entry = useProject(slug)
  const updatedAt = useWorkspace((s) => s.meta?.updatedAt)
  // Only one thumbnail plays at a time.
  const [active, setActive] = useState<string | null>(null)
  const reducedMotion = prefersReducedMotion()

  if (!entry) return null
  const name = entry.project?.name ?? slug
  const count = entry.canvases.length

  return (
    <ProjectsLayout>
      <nav
        className="flex items-center gap-2 text-[15px] text-muted-foreground"
        aria-label="Breadcrumb"
      >
        <Link to="/" className="hover:text-foreground">
          Projects
        </Link>
        <ChevronRight className="size-4" />
        <span className="text-foreground">{name}</span>
      </nav>

      <header className="mt-12">
        <h1 className="text-[40px] font-semibold tracking-tight">{name}</h1>
        {entry.project?.description && (
          <p className="mt-1 text-xl text-muted-foreground">
            {entry.project.description}
          </p>
        )}
        {entry.error && (
          <pre className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            project.json: {entry.error}
          </pre>
        )}
      </header>

      <p className="mt-12 text-[15px] font-medium">
        {count} {count === 1 ? 'canvas' : 'canvases'}
      </p>

      <ul className="mt-5 grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-7">
        {entry.canvases.map((canvas) => (
          <li key={canvas.slug}>
            <CanvasCard
              entry={canvas}
              updatedAt={updatedAt?.[`${slug}/${canvas.slug}`]}
              active={active === canvas.slug}
              onActivate={(on) =>
                setActive((current) =>
                  on ? canvas.slug : current === canvas.slug ? null : current,
                )
              }
              reducedMotion={reducedMotion}
            />
          </li>
        ))}
      </ul>
      {count === 0 && (
        <p className="mt-4 text-sm text-muted-foreground">
          Add a canvas folder at <code>projects/{slug}/canvases/</code>.
        </p>
      )}
    </ProjectsLayout>
  )
}
