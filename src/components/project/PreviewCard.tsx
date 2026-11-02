import { Link, type LinkProps } from '@tanstack/react-router'
import { Pause, Play } from 'lucide-react'
import { type ReactNode, useState } from 'react'
import { prefersReducedMotion } from '@/lib/editor'
import { cn } from '@/lib/utils'
import { Thumbnail } from './Thumbnail'

/**
 * A card with live app frames. Hover or keyboard focus plays them; leaving
 * stops and resets. Reduced motion keeps it still with a play button. On
 * touch, a tap opens the link.
 */
export function PreviewCard({
  link,
  urls,
  device,
  title,
  subtitle,
  active,
  onActivate,
  className,
}: {
  link: LinkProps
  urls: string[]
  device?: string
  title: string
  subtitle?: ReactNode
  active: boolean
  onActivate: (active: boolean) => void
  className?: string
}) {
  const reducedMotion = prefersReducedMotion()
  const [replayKey, setReplayKey] = useState(0)
  const [paused, setPaused] = useState(false)
  const [manual, setManual] = useState(false)
  const playing = active && !paused && (!reducedMotion || manual)

  const start = () => {
    onActivate(true)
    setPaused(false)
    setReplayKey((k) => k + 1)
  }
  const stop = () => {
    onActivate(false)
    setManual(false)
    setReplayKey((k) => k + 1)
  }

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: hover only enhances; keyboard users get the same preview through the link's focus
    <div
      className={className}
      onPointerEnter={(e) => e.pointerType === 'mouse' && start()}
      onPointerLeave={(e) => e.pointerType === 'mouse' && stop()}
      onFocus={start}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) stop()
      }}
    >
      <div
        className={cn(
          'relative aspect-[1.12] overflow-hidden rounded-xl border bg-canvas transition-[border-color,box-shadow] has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-brand',
          active && 'border-brand ring-1 ring-brand',
        )}
      >
        <Thumbnail urls={urls} device={device} playing={playing} replayKey={replayKey} />
        {/* The link overlays the thumbnail rather than wrapping it: the live
            app inside has links of its own, and links can't nest. */}
        <Link
          {...link}
          className="absolute inset-0 outline-none"
          aria-label={`Open ${title}`}
        />
        {active && (
          <button
            type="button"
            onClick={() => {
              if (reducedMotion && !manual) {
                setManual(true)
                setReplayKey((k) => k + 1)
              } else setPaused((p) => !p)
            }}
            aria-label={playing ? 'Pause preview' : 'Play preview'}
            className="absolute right-3 top-3 z-10 grid size-8 place-items-center rounded-full border bg-background/90 shadow-sm backdrop-blur"
          >
            {playing ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
          </button>
        )}
      </div>
      <p className="mt-3 text-[17px] font-medium">{title}</p>
      {subtitle && <p className="text-[14px] text-muted-foreground">{subtitle}</p>}
      {playing && <p className="text-[14px] text-muted-foreground">Playing preview</p>}
    </div>
  )
}
