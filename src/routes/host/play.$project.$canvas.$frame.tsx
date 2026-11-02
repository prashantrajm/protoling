import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Check, LogOut, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FlowPlayer } from '@/components/screen/FlowPlayer'
import type { Frame } from '@/lib/schema'
import { frameLabel, frameVariants, padIndex } from '@/lib/variants'
import { useLoadedScreen } from '@/lib/workspace/screens'
import { useCanvasEntry } from '@/lib/workspace/store'

/**
 * Phone preview (concepts 06 and 08). The prototype fills the screen with no
 * platform controls. A three-finger tap, or ⌘/Ctrl + . on a keyboard, toggles
 * a compact menu. Ordinary taps, swipes and long presses all reach the
 * prototype.
 */
export const Route = createFileRoute('/play/$project/$canvas/$frame')({
  validateSearch: (search: Record<string, unknown>): { v?: string } => ({
    v: typeof search.v === 'string' ? search.v : undefined,
  }),
  component: PlayPage,
})

function PlayPage() {
  const params = Route.useParams()
  const { v } = Route.useSearch()
  const navigate = useNavigate()
  const entry = useCanvasEntry(params.project, params.canvas)
  const [menuOpen, setMenuOpen] = useState(false)
  const [current, setCurrent] = useState(params.frame)
  const [variants, setVariants] = useState<Record<string, string>>(
    v ? { [params.frame]: v } : {},
  )

  const exit = useCallback(
    () =>
      navigate({
        to: '/p/$project/$canvas',
        params: { project: params.project, canvas: params.canvas },
      }),
    [navigate, params.project, params.canvas],
  )

  const menuOpenRef = useRef(menuOpen)
  menuOpenRef.current = menuOpen

  useThreeFingerTap(() => setMenuOpen((open) => !open))

  useEffect(() => {
    document.documentElement.classList.add('sb-play')
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === '.') {
        event.preventDefault()
        setMenuOpen((open) => !open)
      } else if (event.key === 'Escape') {
        // Escape closes the menu first, then exits.
        if (menuOpenRef.current) setMenuOpen(false)
        else void exit()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.documentElement.classList.remove('sb-play')
      window.removeEventListener('keydown', onKey)
    }
  }, [exit])

  if (!entry?.canvas) {
    return (
      <p className="grid h-dvh place-items-center text-sm text-muted-foreground">
        Canvas not found.
      </p>
    )
  }
  const frame = entry.canvas.frames.find((f) => f.id === current)

  return (
    <div className="fixed inset-0 overflow-hidden bg-black">
      <FlowPlayer
        project={params.project}
        canvasSlug={params.canvas}
        canvas={entry.canvas}
        startFrame={params.frame}
        variants={variants}
        mode="device"
        onFrameChange={setCurrent}
      />
      <AnimatePresence>
        {menuOpen && frame && (
          <PhoneMenu
            key="menu"
            project={params.project}
            canvas={params.canvas}
            frame={frame}
            variantId={variants[frame.id] ?? 'default'}
            onVariant={(id) => setVariants((all) => ({ ...all, [frame.id]: id }))}
            onClose={() => setMenuOpen(false)}
            onExit={exit}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function PhoneMenu({
  project,
  canvas,
  frame,
  variantId,
  onVariant,
  onClose,
  onExit,
}: {
  project: string
  canvas: string
  frame: Frame
  variantId: string
  onVariant: (id: string) => void
  onClose: () => void
  onExit: () => void
}) {
  const loaded = useLoadedScreen(project, canvas, frame.screen)
  const options = useMemo(
    () => frameVariants(frame, loaded?.ok ? loaded.screen : null),
    [frame, loaded],
  )
  const panel = useRef<HTMLDivElement>(null)

  useEffect(() => {
    panel.current?.focus()
  }, [])

  return (
    <motion.div
      ref={panel}
      role="dialog"
      aria-label="Preview menu"
      tabIndex={-1}
      className="absolute right-4 z-[2147483600] w-[min(240px,calc(100vw-32px))] rounded-[20px] border border-black/5 bg-white/95 text-[#16161d] shadow-[0_12px_40px_rgba(0,0,0,0.18)] outline-none backdrop-blur-xl"
      style={{
        top: 'calc(env(safe-area-inset-top) + 72px)',
        fontFamily: 'system-ui, sans-serif',
      }}
      initial={{ opacity: 0, scale: 0.92, y: -8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: -4 }}
      transition={{ type: 'spring', visualDuration: 0.28, bounce: 0.2 }}
    >
      <div className="flex items-center justify-between px-4 pb-2 pt-4">
        <span className="text-[17px] font-medium">{frameLabel(frame)}</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close menu"
          className="-m-1 p-1 text-neutral-400"
        >
          <X className="size-5" />
        </button>
      </div>
      {options.length > 1 && (
        <>
          <p className="px-4 pb-1 pt-2 text-[13px] text-neutral-500">Variant</p>
          <ul>
            {options.map((option) => (
              <li key={option.id}>
                <button
                  type="button"
                  onClick={() => onVariant(option.id)}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-[16px] active:bg-black/5"
                >
                  <span className="w-6 tabular-nums text-neutral-400">
                    {padIndex(option.index)}
                  </span>
                  <span className="flex-1">{option.name}</span>
                  {option.id === variantId && (
                    <Check className="size-5 text-[#8b5cf6]" strokeWidth={2.5} />
                  )}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
      <div className="mt-2 border-t border-black/5">
        <button
          type="button"
          onClick={onExit}
          className="flex w-full items-center gap-3 px-4 py-3.5 text-left text-[16px] active:bg-black/5"
        >
          <LogOut className="size-5" />
          Exit preview
        </button>
        <p className="px-4 pb-4 text-[13px] text-neutral-400">Three-finger tap to hide</p>
      </div>
    </motion.div>
  )
}

/**
 * Fires on a quick tap with exactly three fingers that barely move. Longer
 * holds and swipes are left alone so prototypes can use them.
 */
function useThreeFingerTap(onTap: () => void) {
  const callback = useRef(onTap)
  callback.current = onTap

  useEffect(() => {
    let start: { time: number; points: { x: number; y: number }[] } | null = null
    let maxTouches = 0

    const onStart = (event: TouchEvent) => {
      maxTouches = Math.max(maxTouches, event.touches.length)
      if (event.touches.length === 3) {
        start = {
          time: performance.now(),
          points: Array.from(event.touches, (t) => ({ x: t.clientX, y: t.clientY })),
        }
      }
    }
    const onMove = (event: TouchEvent) => {
      if (!start) return
      const moved = Array.from(event.touches).some((t, i) => {
        const p = start?.points[i]
        return p && Math.hypot(t.clientX - p.x, t.clientY - p.y) > 24
      })
      if (moved) start = null
    }
    const onEnd = (event: TouchEvent) => {
      if (event.touches.length > 0) return
      if (start && maxTouches === 3 && performance.now() - start.time < 450)
        callback.current()
      start = null
      maxTouches = 0
    }
    window.addEventListener('touchstart', onStart, { passive: true })
    window.addEventListener('touchmove', onMove, { passive: true })
    window.addEventListener('touchend', onEnd, { passive: true })
    window.addEventListener('touchcancel', onEnd, { passive: true })
    return () => {
      window.removeEventListener('touchstart', onStart)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onEnd)
      window.removeEventListener('touchcancel', onEnd)
    }
  }, [])
}
