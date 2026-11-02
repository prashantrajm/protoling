import { createFileRoute, notFound } from '@tanstack/react-router'
import { BoardView } from '@/components/board/BoardView'
import { findBoard } from '@/lib/boards'
import { findProject, useProjectEntry, useWorkspace } from '@/lib/workspace/store'

export const Route = createFileRoute('/_app/p/$project/boards/$board')({
  beforeLoad: ({ params }) => {
    const entry = findProject(useWorkspace.getState().projects, params.project)
    if (!entry?.hasApp || !findBoard(entry, params.board)) throw notFound()
  },
  component: BoardPage,
})

function BoardPage() {
  const params = Route.useParams()
  const entry = useProjectEntry(params.project)
  const board = entry && findBoard(entry, params.board)
  if (!entry || !board) return null
  return (
    <div className="h-full">
      <BoardView
        key={board.slug}
        project={params.project}
        projectName={entry.project?.name ?? params.project}
        device={entry.project?.device}
        board={board}
      />
    </div>
  )
}
