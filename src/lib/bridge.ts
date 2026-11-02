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
  | { type: 'pl:settings'; timeScale: number; device: string }
  | { type: 'pl:replay' }
  | { type: 'pl:variant'; key: string; id: string }

export type FromApp =
  | { type: 'pl:ready' }
  | { type: 'pl:state'; href: string; screen: ScreenSnapshot | null }
  | { type: 'pl:key'; key: string }

export function readMessage<T extends { type: string }>(event: MessageEvent): T | null {
  if (event.origin !== window.location.origin) return null
  const data = event.data as { type?: unknown } | null
  return typeof data?.type === 'string' && data.type.startsWith('pl:')
    ? (data as T)
    : null
}
