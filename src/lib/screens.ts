import type { AnyRoute, AnyRouter } from '@tanstack/react-router'
import type { MotionToken } from './schema'
import { screenKey } from './variant-param'

/**
 * Reads a project's screens from the route tree. A screen is any route with
 * `staticData.screen`. Boards and arrows are derived from this, so there's
 * nothing to declare twice.
 */
export interface ScreenRoute {
  routeId: string
  key: string
  name: string
  /** URL that shows it, or null if the path needs params. */
  url: string | null
  presentation?: string
  transition?: MotionToken
  /** Route id of the screen that presents this one: its nearest screen ancestor. */
  presenter: string | null
}

function childrenOf(route: AnyRoute): AnyRoute[] {
  const c = route.children as AnyRoute[] | Record<string, AnyRoute> | undefined
  if (!c) return []
  return Array.isArray(c) ? c : Object.values(c)
}

export function projectScreens(router: AnyRouter, project: string): ScreenRoute[] {
  const out: ScreenRoute[] = []
  const walk = (route: AnyRoute, presenter: string | null) => {
    const meta = route.options.staticData?.screen
    let next = presenter
    const inProject = route.id === `/${project}` || route.id.startsWith(`/${project}/`)
    if (meta && inProject) {
      const path = route.fullPath === '/' ? '/' : route.fullPath.replace(/\/$/, '')
      out.push({
        routeId: route.id,
        key: screenKey(route.fullPath, project),
        name: meta.name,
        url: path.includes('$') ? null : path,
        presentation: route.options.staticData?.presentation,
        transition: route.options.staticData?.transition,
        presenter,
      })
      next = route.id
    }
    for (const child of childrenOf(route)) walk(child, next)
  }
  walk(router.routeTree, null)
  return out
}

/** The deepest screen route a URL resolves to. */
export function screenForUrl(router: AnyRouter, url: string): string | null {
  const [pathname, search = ''] = url.split('?')
  const matches = router.matchRoutes(
    pathname,
    Object.fromEntries(new URLSearchParams(search)),
  )
  for (let i = matches.length - 1; i >= 0; i--) {
    if (matches[i].staticData?.screen) return matches[i].routeId
  }
  return null
}

export interface Arrow {
  id: string
  from: string
  to: string
  presentation: string
  transition?: MotionToken
}

/**
 * Arrows between frames, from the route tree: a frame showing a presented
 * screen gets an arrow from the nearest earlier frame showing its presenter.
 */
export function deriveArrows(
  frames: { id: string; routeId: string | null }[],
  screens: Map<string, Pick<ScreenRoute, 'presenter' | 'presentation' | 'transition'>>,
): Arrow[] {
  const arrows: Arrow[] = []
  frames.forEach((frame, i) => {
    const screen = frame.routeId ? screens.get(frame.routeId) : undefined
    if (!screen?.presenter || !screen.presentation) return
    for (let j = i - 1; j >= 0; j--) {
      if (frames[j].routeId === screen.presenter) {
        arrows.push({
          id: `${frames[j].id}->${frame.id}`,
          from: frames[j].id,
          to: frame.id,
          presentation: screen.presentation,
          transition: screen.transition,
        })
        return
      }
    }
  })
  return arrows
}

const routeFiles = Object.keys(import.meta.glob('/projects/*/app/**/*.tsx'))

/** Source file for a route id, e.g. "projects/orbit/app/_tabs/today/route.tsx". */
export function fileForRoute(routeId: string, project: string): string | null {
  const rel = routeId.replace(new RegExp(`^/${project}`), '').replace(/^\//, '')
  const base = `/projects/${project}/app`
  const candidates =
    rel.endsWith('/') || rel === ''
      ? rel === ''
        ? [`${base}/route.tsx`]
        : [`${base}/${rel}index.tsx`]
      : [`${base}/${rel}.tsx`, `${base}/${rel}/route.tsx`]
  const hit = candidates.find((c) => routeFiles.includes(c))
  return hit ? hit.slice(1) : null
}
