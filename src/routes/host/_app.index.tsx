import { createFileRoute, redirect } from '@tanstack/react-router'
import { ProjectsLayout } from '@/components/shell/ProjectsLayout'
import { useWorkspace } from '@/lib/workspace/store'

export const Route = createFileRoute('/_app/')({
  beforeLoad: () => {
    const first = useWorkspace.getState().projects[0]
    if (first) throw redirect({ to: '/p/$project', params: { project: first.slug } })
  },
  component: Empty,
})

function Empty() {
  return (
    <ProjectsLayout>
      <div className="mx-auto max-w-xl py-24">
        <h1 className="text-3xl font-semibold tracking-tight">No projects yet</h1>
        <p className="mt-3 text-muted-foreground">
          A project is a small app made of TanStack Router file routes. Create one under{' '}
          <code>projects/</code>:
        </p>
        <pre className="mt-5 rounded-lg border bg-muted/40 p-4 font-mono text-[13px] leading-relaxed">
          {`projects/my-app/
  project.json          { "name": "My app" }
  app/
    route.tsx           the app's root layout
    home.tsx            a screen, at /my-app/home`}
        </pre>
        <p className="mt-4 text-sm text-muted-foreground">
          Springboard picks it up straight away. See the README and AGENTS.md for the
          details.
        </p>
      </div>
    </ProjectsLayout>
  )
}
