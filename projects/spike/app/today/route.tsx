import { createFileRoute, Link } from '@tanstack/react-router'
import { StackScreen } from '@/runtime/nav'

export const Route = createFileRoute('/spike/today')({ component: Today })

function Today() {
  return (
    <StackScreen>
      <div className="h-full bg-white p-5">
        <h1 className="mb-4 text-3xl font-bold">Today</h1>
        {['a', 'b', 'c'].map((task) => (
          <Link
            key={task}
            to="/spike/today/detail"
            search={{ task }}
            className="block border-b py-3"
            data-task={task}
          >
            Task {task.toUpperCase()}
          </Link>
        ))}
      </div>
    </StackScreen>
  )
}
