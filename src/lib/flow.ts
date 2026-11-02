import type { Canvas, Connector, Frame } from './schema'

/**
 * Resolves `navigate(target)` from a frame: by frame id, then by screen name,
 * and with no target, the first connector leaving the frame. Returns the
 * connector that links the two when there is one, so its animation and
 * transition can be used.
 */
export function resolveNavigation(
  canvas: Canvas,
  fromFrameId: string,
  target?: string,
): { frame: Frame; connector: Connector | null } | null {
  const outgoing = canvas.connectors.filter((c) => c.from === fromFrameId)

  let frame: Frame | undefined
  if (target === undefined) {
    const first = outgoing[0]
    frame = first && canvas.frames.find((f) => f.id === first.to)
  } else {
    frame =
      canvas.frames.find((f) => f.id === target) ??
      canvas.frames.find((f) => f.screen === target) ??
      canvas.frames.find((f) => f.screen.toLowerCase() === target.toLowerCase())
  }
  if (!frame) return null

  const connector = outgoing.find((c) => c.to === frame.id) ?? null
  return { frame, connector }
}
