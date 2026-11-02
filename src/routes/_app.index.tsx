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
          Springboard reads everything from the <code>projects/</code> folder. Create a
          project with a canvas and a screen:
        </p>
        <pre className="mt-5 rounded-lg border bg-muted/40 p-4 font-mono text-[13px] leading-relaxed">
          {`projects/my-app/
  project.json          { "name": "My app" }
  canvases/home/
    canvas.json         frames and connectors
    screens/Home.tsx    export default defineScreen({...})`}
        </pre>
        <p className="mt-4 text-sm text-muted-foreground">
          The page updates as soon as the files exist. See the README for the full format.
        </p>
      </div>
    </ProjectsLayout>
  )
}
