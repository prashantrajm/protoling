import type { AnyRouter } from '@tanstack/react-router'

/**
 * The host router and its route tree, registered from main.tsx. Board frames
 * create their own routers from the same tree; importing routeTree.gen from
 * inside a route file would be circular, so they read it from here.
 */
let hostRouter: AnyRouter | null = null

export function setHostRouter(router: AnyRouter): void {
  hostRouter = router
}

export function getHostRouter(): AnyRouter {
  if (!hostRouter) throw new Error('Host router not registered yet')
  return hostRouter
}
