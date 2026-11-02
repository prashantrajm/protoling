import type { MotionToken, MotionTokens } from './schema'

/**
 * postMessage protocol between the desktop play page and the mini app in its
 * iframe. Same origin only.
 */
export interface ScreenSnapshot {
  key: string
  routeId: string
  name: string
  variants: { id: string; name: string; index: number }[]
  variantId: string
  tokens: MotionTokens
  presentation?: string
  transition?: MotionToken
  statusBar?: 'dark' | 'light'
}

export type ToApp =
  | { type: 'sb:settings'; timeScale: number; device: string }
  | { type: 'sb:replay' }
  | { type: 'sb:variant'; key: string; id: string }

export type FromApp =
  | { type: 'sb:ready' }
  | { type: 'sb:state'; href: string; screen: ScreenSnapshot | null }
  | { type: 'sb:key'; key: string }

export function readMessage<T extends { type: string }>(event: MessageEvent): T | null {
  if (event.origin !== window.location.origin) return null
  const data = event.data as { type?: unknown } | null
  return typeof data?.type === 'string' && data.type.startsWith('sb:')
    ? (data as T)
    : null
}
