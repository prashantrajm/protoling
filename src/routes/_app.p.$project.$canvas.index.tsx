import { createFileRoute, notFound } from '@tanstack/react-router'
import { CanvasEditor } from '@/components/canvas/CanvasEditor'
import {
  findCanvas,
  useCanvasEntry,
  useProject,
  useWorkspace,
} from '@/lib/workspace/store'

export const Route = createFileRoute('/_app/p/$project/$canvas/')({
  beforeLoad: ({ params }) => {
    if (!findCanvas(useWorkspace.getState().projects, params.project, params.canvas))
      throw notFound()
  },
  component: CanvasPage,
})

function CanvasPage() {
  const params = Route.useParams()
  const project = useProject(params.project)
  const entry = useCanvasEntry(params.project, params.canvas)
  if (!entry) return null

  if (!entry.canvas) {
    return (
      <div className="mx-auto max-w-2xl p-10">
        <h1 className="text-xl font-semibold">This canvas has errors</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Fix{' '}
          <code>
            projects/{params.project}/canvases/{params.canvas}/canvas.json
          </code>{' '}
          and the page will update.
        </p>
        <pre className="mt-4 whitespace-pre-wrap rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
          {entry.error}
        </pre>
      </div>
    )
  }

  return (
    <div className="h-full">
      <CanvasEditor
        project={params.project}
        projectName={project?.project?.name ?? params.project}
        slug={params.canvas}
        canvas={entry.canvas}
      />
    </div>
  )
}
