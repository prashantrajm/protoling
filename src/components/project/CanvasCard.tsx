import { Link } from '@tanstack/react-router'
import { Pause, Play } from 'lucide-react'
import { useState } from 'react'
import { timeAgo } from '@/lib/time'
import { cn } from '@/lib/utils'
import type { CanvasEntry } from '@/lib/workspace/store'
import { CanvasThumbnail } from './CanvasThumbnail'

/**
 * Hover or keyboard focus plays the canvas's preview; leaving stops and
 * resets it. With reduced motion the card stays still and shows a play
 * button instead. On touch, a tap simply opens the canvas.
 */
export function CanvasCard({
  entry,
  updatedAt,
  active,
  onActivate,
  reducedMotion,
}: {
  entry: CanvasEntry
  updatedAt?: string
  active: boolean
  onActivate: (active: boolean) => void
  reducedMotion: boolean
}) {
  const [replayKey, setReplayKey] = useState(0)
  const [paused, setPaused] = useState(false)
  const [manualPlay, setManualPlay] = useState(false)
  const playing = active && !paused && (!reducedMotion || manualPlay)
  const name = entry.canvas?.name ?? entry.slug
  const edited = timeAgo(updatedAt)

  function start() {
    onActivate(true)
    setPaused(false)
    setReplayKey((k) => k + 1)
  }

  function stop() {
    onActivate(false)
    setManualPlay(false)
    setReplayKey((k) => k + 1)
  }

  function togglePlayback() {
    if (reducedMotion && !manualPlay) {
      setManualPlay(true)
      setReplayKey((k) => k + 1)
    } else {
      setPaused((p) => !p)
    }
  }

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: hover only enhances; keyboard users get the same preview through the link's focus
    <div
      onPointerEnter={(e) => e.pointerType === 'mouse' && start()}
      onPointerLeave={(e) => e.pointerType === 'mouse' && stop()}
      onFocus={start}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) stop()
      }}
    >
      <div className="relative">
        <Link
          to="/p/$project/$canvas"
          params={{ project: entry.project, canvas: entry.slug }}
          className={cn(
            'relative block aspect-[1.12] overflow-hidden rounded-xl border bg-canvas outline-none transition-[border-color,box-shadow]',
            active && 'border-brand ring-1 ring-brand',
          )}
          aria-label={`Open ${name}`}
        >
          {entry.canvas ? (
            <CanvasThumbnail
              project={entry.project}
              slug={entry.slug}
              canvas={entry.canvas}
              playing={playing}
              replayKey={replayKey}
            />
          ) : (
            <pre className="absolute inset-0 overflow-auto p-4 text-xs text-destructive">
              canvas.json: {entry.error}
            </pre>
          )}
        </Link>
        {active && entry.canvas && (
          <button
            type="button"
            onClick={togglePlayback}
            aria-label={playing ? 'Pause preview' : 'Play preview'}
            className="absolute right-3 top-3 z-10 grid size-8 place-items-center rounded-full border bg-background/90 text-foreground shadow-sm backdrop-blur"
          >
            {playing ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
          </button>
        )}
      </div>
      <p className="mt-3 text-[17px] font-medium">{name}</p>
      <p className="text-[14px] text-muted-foreground">
        {edited ? `Edited ${edited}` : `${entry.canvas?.frames.length ?? 0} screens`}
      </p>
      {playing && <p className="text-[14px] text-muted-foreground">Playing preview</p>}
    </div>
  )
}
