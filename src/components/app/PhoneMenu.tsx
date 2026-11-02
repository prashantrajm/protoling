import { Check, LogOut, RotateCcw, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef } from 'react'

/**
 * The hidden menu on a real phone (concept 08): variants of the screen on
 * top, and Exit preview (or Restart in a share build). Shown by a
 * three-finger tap or ⌘/Ctrl + .
 */
export function PhoneMenu({
  open,
  title,
  variants,
  variantId,
  onVariant,
  onClose,
  action,
  onAction,
  hint,
}: {
  open: boolean
  title: string
  variants: { id: string; name: string; index: number }[]
  variantId: string
  onVariant: (id: string) => void
  onClose: () => void
  /** "exit" leaves for Protoling's tooling; "restart" goes back to the app's start. */
  action: 'exit' | 'restart'
  onAction: () => void
  hint: string
}) {
  const panel = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (open) panel.current?.focus()
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={panel}
          role="dialog"
          aria-label="Preview menu"
          tabIndex={-1}
          className="absolute right-4 z-[200] w-[min(240px,calc(100%-32px))] rounded-[20px] border border-black/5 bg-white/95 text-[#16161d] shadow-[0_12px_40px_rgba(0,0,0,0.18)] outline-none backdrop-blur-xl"
          style={{
            top: 'calc(var(--safe-top) + 72px)',
            fontFamily: 'system-ui, sans-serif',
          }}
          initial={{ opacity: 0, scale: 0.92, y: -8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -4 }}
          transition={{ type: 'spring', visualDuration: 0.28, bounce: 0.2 }}
        >
          <div className="flex items-center justify-between px-4 pb-2 pt-4">
            <span className="text-[17px] font-medium">{title}</span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close menu"
              className="-m-1 p-1 text-neutral-400"
            >
              <X className="size-5" />
            </button>
          </div>
          {variants.length > 1 && (
            <>
              <p className="px-4 pb-1 pt-2 text-[13px] text-neutral-500">Variant</p>
              <ul>
                {variants.map((v) => (
                  <li key={v.id}>
                    <button
                      type="button"
                      onClick={() => onVariant(v.id)}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-[16px] active:bg-black/5"
                    >
                      <span className="w-6 tabular-nums text-neutral-400">
                        {String(v.index + 1).padStart(2, '0')}
                      </span>
                      <span className="flex-1">{v.name}</span>
                      {v.id === variantId && (
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
              onClick={onAction}
              className="flex w-full items-center gap-3 px-4 py-3.5 text-left text-[16px] active:bg-black/5"
            >
              {action === 'exit' ? (
                <>
                  <LogOut className="size-5" />
                  Exit preview
                </>
              ) : (
                <>
                  <RotateCcw className="size-5" />
                  Restart
                </>
              )}
            </button>
            <p className="px-4 pb-4 text-[13px] text-neutral-400">{hint}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/**
 * Fires on a quick tap with exactly three fingers that barely move. Longer
 * holds and swipes are left to the prototype.
 */
export function useThreeFingerTap(onTap: () => void) {
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
