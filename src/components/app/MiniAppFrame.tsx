import {
  type AnyRouter,
  createMemoryHistory,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router'
import { type CSSProperties, useEffect, useMemo, useState } from 'react'
import type { Device } from '@/lib/devices'
import { getHostRouter } from '@/lib/router-registry'
import { cn } from '@/lib/utils'
import { FrameContext } from './frame-context'

/**
 * The real mini app, at a URL, inside a device-sized box. Each frame has its
 * own router with in-memory history, so many app states can run side by side
 * and navigating inside one changes nothing else.
 *
 * The box is a size container and `transform` makes it the containing block
 * for position: fixed, so screens behave as if the frame were the viewport.
 */
export function MiniAppFrame({
  url,
  device,
  playing = true,
  timeScale = 1,
  replayKey = 0,
  onRouter,
  className,
  style,
}: {
  url: string
  device: Device
  playing?: boolean
  timeScale?: number
  replayKey?: number
  /** Called with this frame's router, e.g. so an inspector can follow it. */
  onRouter?: (router: AnyRouter | null) => void
  className?: string
  style?: CSSProperties
}) {
  const [router] = useState(() =>
    createRouter({
      routeTree: getHostRouter().routeTree,
      history: createMemoryHistory({ initialEntries: [url] }),
    }),
  )

  // A new URL for the same frame (e.g. a variant chosen from outside).
  useEffect(() => {
    if (router.state.location.href !== url) router.history.replace(url)
  }, [router, url])

  useEffect(() => {
    onRouter?.(router)
    return () => onRouter?.(null)
  }, [router, onRouter])

  const frame = useMemo(
    () => ({ device, playing, timeScale, replayKey }),
    [device, playing, timeScale, replayKey],
  )

  return (
    <div
      className={cn('relative overflow-hidden [transform:translateZ(0)]', className)}
      style={{
        width: device.width,
        height: device.height,
        borderRadius: device.radius,
        containerType: 'size',
        ...style,
      }}
    >
      <FrameContext value={frame}>
        <RouterProvider router={router} />
      </FrameContext>
    </div>
  )
}
