import { createFileRoute, Link } from '@tanstack/react-router'
import { StackScreen, useDismiss } from '@/runtime/nav'

export const Route = createFileRoute('/spike/today/detail')({
  validateSearch: (s: Record<string, unknown>): { task: string } => ({
    task: typeof s.task === 'string' ? s.task : 'a',
  }),
  staticData: { presentation: 'push' },
  component: Detail,
})

function Detail() {
  // A strict route hook: proves the screen stays matched while it animates out.
  const { task } = Route.useSearch()
  const dismiss = useDismiss()
  return (
    <StackScreen>
      <div className="h-full bg-white p-5">
        <button
          type="button"
          onClick={dismiss}
          className="mb-4 text-violet-600"
          data-back
        >
          ‹ Today
        </button>
        <h1 className="text-3xl font-bold" data-title>
          Task {task.toUpperCase()}
        </h1>
        <Link
          to="/spike/today/detail/move"
          search={{ task }}
          className="mt-6 inline-block rounded-lg bg-violet-100 px-4 py-2 text-violet-700"
          data-move
        >
          Move to…
        </Link>
      </div>
    </StackScreen>
  )
}
