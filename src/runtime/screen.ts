import {
  type AnyRouteMatch,
  useMatch,
  useMatches,
  useRouter,
} from '@tanstack/react-router'
import type { Transition } from 'motion/react'
import { useCallback, useMemo } from 'react'
import { toTransition } from '@/lib/motion/tokens'
import type { MotionToken, MotionTokens } from '@/lib/schema'
import { parseVariants, screenKey, withVariant } from '@/lib/variant-param'
import { useMiniApp } from './app-context'
import type { ScreenMeta } from './types'

const fallback: MotionToken = { type: 'spring', visualDuration: 0.4, bounce: 0.15 }

export interface VariantInfo {
  id: string
  name: string
  index: number
}

export interface ResolvedScreen {
  key: string
  routeId: string
  meta: ScreenMeta
  variants: VariantInfo[]
  variant: VariantInfo
  /** Defaults with the active variant applied. */
  tokens: MotionTokens
}

/** Variant 01 is always the defaults, then the screen's variants in order. */
export function listVariants(meta: ScreenMeta): VariantInfo[] {
  return [
    { id: 'default', name: 'Default', index: 0 },
    ...Object.entries(meta.variants ?? {}).map(([id, v], i) => ({
      id,
      name: v.name,
      index: i + 1,
    })),
  ]
}

export function resolveScreen(
  match: Pick<AnyRouteMatch, 'routeId' | 'fullPath' | 'staticData'>,
  project: string,
  variantParam: unknown,
): ResolvedScreen | null {
  const meta = match.staticData?.screen
  if (!meta) return null
  const key = screenKey(match.fullPath, project)
  const variants = listVariants(meta)
  const chosen = parseVariants(variantParam)[key]
  const variant = variants.find((v) => v.id === chosen) ?? variants[0]
  const tokens: MotionTokens = { ...meta.motion }
  for (const [name, token] of Object.entries(meta.variants?.[variant.id]?.motion ?? {})) {
    if (token) tokens[name] = token
  }
  return { key, routeId: match.routeId, meta, variants, variant, tokens }
}

/**
 * The screen the calling component belongs to: its own route if that route
 * declares `staticData.screen`, otherwise the nearest parent that does.
 */
function useNearestScreen(): ResolvedScreen | null {
  const { project } = useMiniApp('useMotion()')
  const current = useMatch({ strict: false })
  const matches = useMatches()
  const v = (current.search as { v?: unknown }).v
  return useMemo(() => {
    const index = matches.findIndex((m) => m.id === current.id)
    for (let i = index; i >= 0; i--) {
      const resolved = resolveScreen(matches[i], project, v)
      if (resolved) return resolved
    }
    return null
  }, [matches, current.id, project, v])
}

/**
 * A Motion `transition` for one of this screen's motion tokens, with the
 * active variant and slow motion applied.
 *
 * ```tsx
 * const enter = useMotion('enter')
 * <motion.div animate={{ y: 0 }} transition={enter} />
 * ```
 */
export function useMotion(key: string): Transition {
  const screen = useNearestScreen()
  const { timeScale } = useMiniApp('useMotion()')
  const token = screen?.tokens[key]
  if (!token && import.meta.env.DEV) {
    console.warn(
      `[protoling] Unknown motion token "${key}". Declare it in staticData.screen.motion of this route or a parent.`,
    )
  }
  return useMemo(() => toTransition(token ?? fallback, timeScale), [token, timeScale])
}

/** The active variant of this screen, and a setter that updates the URL. */
export function useVariant(): VariantInfo & {
  variants: VariantInfo[]
  setVariant: (id: string) => void
} {
  const screen = useNearestScreen()
  const router = useRouter()
  const key = screen?.key
  const setVariant = useCallback(
    (id: string) => {
      if (key) setVariantInUrl(router, key, id)
    },
    [router, key],
  )
  const variant = screen?.variant ?? { id: 'default', name: 'Default', index: 0 }
  return { ...variant, variants: screen?.variants ?? [variant], setVariant }
}

export function setVariantInUrl(
  router: ReturnType<typeof useRouter>,
  key: string,
  id: string,
) {
  const { pathname, search } = router.state.location
  void router.navigate({
    to: pathname,
    search: { ...search, v: withVariant((search as { v?: unknown }).v, key, id) },
    replace: true,
  } as never)
}
