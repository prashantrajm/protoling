import { createFileRoute } from '@tanstack/react-router'
import { useDismiss } from '@/runtime/nav'

export const Route = createFileRoute('/spike/today/detail/move')({
  staticData: {
    presentation: 'sheet',
    transition: { type: 'spring', visualDuration: 0.5, bounce: 0.12 },
  },
  component: Move,
})

function Move() {
  const dismiss = useDismiss()
  const { task } = Route.useSearch()
  return (
    <div className="p-5" data-sheet>
      <div className="mx-auto mb-4 h-1 w-9 rounded bg-neutral-300" />
      <h2 className="text-lg font-semibold">Move task {task.toUpperCase()} to…</h2>
      {['Inbox', 'Upcoming', 'Someday'].map((l) => (
        <p key={l} className="border-b py-3">
          {l}
        </p>
      ))}
      <button type="button" onClick={dismiss} className="mt-4 text-violet-600" data-close>
        Done
      </button>
    </div>
  )
}
