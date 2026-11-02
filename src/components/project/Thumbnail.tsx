import { useEffect, useRef, useState } from 'react'
import { MiniAppFrame } from '@/components/app/MiniAppFrame'
import { getDevice } from '@/lib/devices'

const gap = 40
const padding = 28

/**
 * Live app frames scaled down to fit a card. Still (animations skipped to
 * their end state) until `playing`; each replay starts them fresh.
 */
export function Thumbnail({
  urls,
  device: deviceId,
  playing,
  replayKey,
}: {
  urls: string[]
  device?: string
  playing: boolean
  replayKey: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [box, setBox] = useState({ width: 0, height: 0 })
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) =>
      setBox({ width: entry.contentRect.width, height: entry.contentRect.height }),
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const device = getDevice(deviceId)
  const total = urls.length * device.width + gap * Math.max(0, urls.length - 1)
  const scale =
    box.width === 0
      ? 0
      : Math.min(
          (box.width - padding * 2) / total,
          (box.height - padding * 2) / device.height,
        )

  return (
    <div
      ref={ref}
      inert
      className="pl-dots pointer-events-none absolute inset-0 flex items-center justify-center bg-canvas"
      style={{ gap: gap * scale }}
    >
      {scale > 0 &&
        urls.map((url, i) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: the same URL can appear twice
            key={`${i}-${url}`}
            className="shrink-0 shadow-[0_1px_2px_rgba(0,0,0,0.06),0_0_0_1px_var(--frame-border)]"
            style={{
              width: device.width * scale,
              height: device.height * scale,
              borderRadius: device.radius * scale,
            }}
          >
            <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}>
              <MiniAppFrame key={replayKey} url={url} device={device} playing={playing} />
            </div>
          </div>
        ))}
      {urls.length === 0 && (
        <p className="text-sm text-muted-foreground">No screens yet</p>
      )}
    </div>
  )
}
