import { useEffect, useRef, useState } from 'react'
import { ScreenHost } from '@/components/screen/ScreenHost'
import { getDevice } from '@/lib/devices'
import type { Canvas } from '@/lib/schema'
import type { FlowControls } from '@/runtime/context'

const gap = 40
const padding = 28

const inertFlow: FlowControls = {
  navigate: () => {},
  back: () => {},
  canGoBack: false,
  params: {},
}

/**
 * Real screens from a canvas, scaled down to fit a card. Still (animations
 * skipped to their end state) until `playing`, then remounted so each screen
 * plays its entrance.
 */
export function CanvasThumbnail({
  project,
  slug,
  canvas,
  playing,
  replayKey,
}: {
  project: string
  slug: string
  canvas: Canvas
  playing: boolean
  replayKey: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [box, setBox] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => {
      setBox({ width: entry.contentRect.width, height: entry.contentRect.height })
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const ids = canvas.preview ?? canvas.frames.slice(0, 3).map((f) => f.id)
  const frames = ids
    .map((id) => canvas.frames.find((f) => f.id === id))
    .filter((f) => f !== undefined)
  const sized = frames.map((frame) => ({
    frame,
    device: getDevice(frame.device ?? canvas.device),
  }))
  const totalWidth =
    sized.reduce((sum, s) => sum + s.device.width, 0) + gap * (sized.length - 1)
  const maxHeight = Math.max(...sized.map((s) => s.device.height), 1)
  const scale =
    box.width === 0
      ? 0
      : Math.min(
          (box.width - padding * 2) / totalWidth,
          (box.height - padding * 2) / maxHeight,
        )

  return (
    <div
      ref={ref}
      inert
      className="sb-dots pointer-events-none absolute inset-0 flex items-center justify-center bg-canvas"
      style={{ gap: gap * scale }}
    >
      {scale > 0 &&
        sized.map(({ frame, device }) => (
          <div
            key={frame.id}
            className="shrink-0 shadow-[0_1px_2px_rgba(0,0,0,0.06),0_0_0_1px_var(--frame-border)]"
            style={{
              width: device.width * scale,
              height: device.height * scale,
              borderRadius: device.radius * scale,
            }}
          >
            <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}>
              <ScreenHost
                project={project}
                canvas={slug}
                frame={frame}
                device={device}
                mode="thumbnail"
                playing={playing}
                replayKey={replayKey}
                flow={inertFlow}
              />
            </div>
          </div>
        ))}
      {frames.length === 0 && (
        <p className="text-sm text-muted-foreground">No frames yet</p>
      )}
    </div>
  )
}
