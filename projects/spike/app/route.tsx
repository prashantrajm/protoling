import { createFileRoute, Link, Outlet, useLocation } from '@tanstack/react-router'
import { useRef } from 'react'

/** Mini app root: tab bar that remembers each tab's stack, like a native app. */
export const Route = createFileRoute('/spike')({ component: AppLayout })

const tabs = [
  { id: 'today', label: 'Today', root: '/spike/today' },
  { id: 'me', label: 'Me', root: '/spike/me' },
] as const

function AppLayout() {
  const location = useLocation()
  const last = useRef<Record<string, string>>({})
  const active = tabs.find((t) => location.pathname.startsWith(t.root))
  if (active) last.current[active.id] = location.href

  return (
    <div className="flex h-full flex-col bg-white text-neutral-900">
      <div className="relative min-h-0 flex-1">
        <Outlet />
      </div>
      <nav className="flex justify-around border-t py-2 text-sm">
        {tabs.map((t) => (
          <Link
            key={t.id}
            to={last.current[t.id] ?? t.root}
            data-tab={t.id}
            className={
              active?.id === t.id ? 'font-semibold text-violet-600' : 'text-neutral-500'
            }
          >
            {t.label}
          </Link>
        ))}
      </nav>
    </div>
  )
}
