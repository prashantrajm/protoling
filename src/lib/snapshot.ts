import type { AnyRouteMatch } from '@tanstack/react-router'
import { resolveScreen } from '@/runtime/screen'
import type { ScreenSnapshot } from './bridge'

/** What the inspector shows: the deepest matched route that is a screen. */
export function topScreenSnapshot(
  matches: AnyRouteMatch[],
  project: string,
): ScreenSnapshot | null {
  for (let i = matches.length - 1; i >= 0; i--) {
    const m = matches[i]
    const resolved = resolveScreen(m, project, (m.search as { v?: unknown }).v)
    if (resolved) {
      return {
        key: resolved.key,
        routeId: resolved.routeId,
        name: resolved.meta.name,
        variants: resolved.variants,
        variantId: resolved.variant.id,
        tokens: resolved.tokens,
        presentation: m.staticData?.presentation,
        transition: m.staticData?.transition,
        statusBar: resolved.meta.statusBar,
      }
    }
  }
  return null
}
