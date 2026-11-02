import { useLocation, useRouter } from '@tanstack/react-router'
import { useCallback, useRef } from 'react'

/**
 * Tab state for a tab-bar layout route. Each tab remembers where you left
 * it, so returning to a tab restores its stack, as on iOS.
 *
 * ```tsx
 * const tabs = useTabs({ today: '/orbit/today', me: '/orbit/me' })
 * <button onClick={() => tabs.select('me')} aria-selected={tabs.active === 'me'}>Me</button>
 * ```
 */
export function useTabs<Id extends string>(
  roots: Record<Id, string>,
): { active: Id | undefined; select: (id: Id) => void } {
  const router = useRouter()
  const location = useLocation()
  const last = useRef<Partial<Record<Id, string>>>({})

  const active = (Object.keys(roots) as Id[]).find((id) => {
    const root = roots[id]
    return location.pathname === root || location.pathname.startsWith(`${root}/`)
  })
  if (active) last.current[active] = location.href

  const select = useCallback(
    (id: Id) => {
      const target = id === active ? roots[id] : (last.current[id] ?? roots[id])
      // Switching tabs isn't a step in history, just as on iOS.
      router.history.replace(target)
    },
    [active, roots, router],
  )

  return { active, select }
}
