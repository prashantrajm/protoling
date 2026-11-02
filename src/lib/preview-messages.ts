/**
 * Messages between the focus page and the embedded preview iframe. Both are
 * same-origin; anything from another origin is ignored.
 */
export type ToPreview =
  | { type: 'springboard:state'; variants: Record<string, string>; timeScale: number }
  | { type: 'springboard:replay' }

export type FromPreview =
  | { type: 'springboard:ready' }
  | { type: 'springboard:frame'; frameId: string }
  /** Shortcuts pressed while the iframe has focus, forwarded to the page. */
  | { type: 'springboard:key'; key: string; shiftKey: boolean }

export function isMessage<T extends { type: string }>(event: MessageEvent): T | null {
  if (event.origin !== window.location.origin) return null
  const data = event.data as { type?: unknown } | null
  return typeof data?.type === 'string' && data.type.startsWith('springboard:')
    ? (data as T)
    : null
}
