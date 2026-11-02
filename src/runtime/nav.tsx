/**
 * SPIKE — native-feeling navigation on top of plain TanStack Router.
 *
 * Stack = nested routes. At /app/today/detail both "today" and "detail" are
 * matched, so the screen underneath stays mounted like a native navigation
 * stack. A screen renders its content through <StackScreen>, which layers the
 * child route on top with a push or sheet animation.
 *
 * Back is "animate, then navigate": the leaving screen animates out while its
 * route is still matched (its hooks keep working), then history moves. That
 * also makes swipe-back interactive.
 */
import { Outlet, useMatch, useMatches, useRouter } from '@tanstack/react-router'
import {
  AnimatePresence,
  animate,
  type MotionValue,
  motion,
  type PanInfo,
  useDragControls,
  useMotionValue,
  useTransform,
} from 'motion/react'
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { toTransition } from '@/lib/motion/tokens'
import type { MotionToken } from '@/lib/schema'

export type Presentation = 'push' | 'sheet'

declare module '@tanstack/react-router' {
  interface StaticDataRouteOption {
    /** How this route appears when navigated to from its parent. */
    presentation?: Presentation
    /** Transition used to present and dismiss it. */
    transition?: MotionToken
  }
}

const defaultTransition: MotionToken = { type: 'spring', visualDuration: 0.45, bounce: 0 }

const LayerContext = createContext<{ dismiss: () => void } | null>(null)

/** Dismiss the current pushed screen or sheet with its animation, then navigate back. */
export function useDismiss(): () => void {
  const layer = useContext(LayerContext)
  const router = useRouter()
  return layer?.dismiss ?? (() => router.history.back())
}

function useChildMatch() {
  const current = useMatch({ strict: false })
  const matches = useMatches()
  const index = matches.findIndex((m) => m.id === current.id)
  return { current, child: index >= 0 ? matches[index + 1] : undefined }
}

export function StackScreen({ children }: { children: ReactNode }) {
  const { current, child } = useChildMatch()
  const router = useRouter()
  const box = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: 393, height: 852 })
  const progress = useMotionValue(0) // 0 = child fully off, 1 = fully on

  useLayoutEffect(() => {
    const el = box.current
    if (!el) return
    const update = () => setSize({ width: el.clientWidth, height: el.clientHeight })
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const presentation = child?.staticData?.presentation ?? 'push'
  const token = child?.staticData?.transition ?? defaultTransition
  // Stable identity: a new object every render would restart running animations.
  // biome-ignore lint/correctness/useExhaustiveDependencies: keyed on the token's value
  const transition = useMemo(() => toTransition(token), [JSON.stringify(token)])
  const parentX = useTransform(
    progress,
    [0, 1],
    [0, presentation === 'push' ? -size.width * 0.3 : 0],
  )
  const parentScale = useTransform(
    progress,
    [0, 1],
    [1, presentation === 'sheet' ? 0.94 : 1],
  )
  const parentDim = useTransform(
    progress,
    [0, 1],
    [0, presentation === 'sheet' ? 0.35 : 0.12],
  )

  // Browser-initiated back (no dismiss() call): settle the parent back.
  useEffect(() => {
    if (!child) animate(progress, 0, transition)
  }, [child, progress, transition])

  const goBack = useCallback(() => {
    if (router.history.canGoBack()) router.history.back()
    else void router.navigate({ to: current.pathname, replace: true })
  }, [router, current.pathname])

  return (
    <div ref={box} className="relative h-full overflow-hidden bg-black">
      <motion.div
        className="absolute inset-0 origin-center overflow-hidden"
        style={{
          x: parentX,
          scale: parentScale,
          borderRadius: presentation === 'sheet' ? 12 : 0,
        }}
      >
        {children}
        <motion.div
          className="pointer-events-none absolute inset-0 bg-black"
          style={{ opacity: parentDim }}
        />
      </motion.div>
      <AnimatePresence initial={false}>
        {child && (
          <Layer
            key={child.id}
            presentation={presentation}
            size={size}
            progress={progress}
            transition={transition}
            onDismissed={goBack}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function Layer({
  presentation,
  size,
  progress,
  transition,
  onDismissed,
}: {
  presentation: Presentation
  size: { width: number; height: number }
  progress: MotionValue<number>
  transition: ReturnType<typeof toTransition>
  onDismissed: () => void
}) {
  const push = presentation === 'push'
  const distance = push ? size.width : size.height
  const offset = useMotionValue(distance)
  const controls = useDragControls()
  const dismissing = useRef(false)

  // Keep progress (which drives the parent) in step with this layer.
  useEffect(
    () => offset.on('change', (v) => progress.set(1 - v / distance)),
    [offset, progress, distance],
  )

  // Present once, on mount. Later renders must not restart it mid-dismiss.
  // biome-ignore lint/correctness/useExhaustiveDependencies: mount-only
  useEffect(() => {
    const a = animate(offset, 0, transition)
    return () => a.stop()
  }, [])

  const dismiss = useCallback(() => {
    if (dismissing.current) return
    dismissing.current = true
    // Navigate once the layer is visually gone, not when the spring fully
    // settles: a spring's last 0.1% can take another few hundred ms.
    let done = false
    const finish = () => {
      if (done) return
      done = true
      stop()
      onDismissed()
    }
    const stop = offset.on('change', (v) => {
      if (v >= distance * 0.995) finish()
    })
    animate(offset, distance, { ...transition, onComplete: finish })
  }, [offset, distance, transition, onDismissed])

  function onDragEnd(_: unknown, info: PanInfo) {
    const travelled = push ? info.offset.x : info.offset.y
    const velocity = push ? info.velocity.x : info.velocity.y
    if (travelled > distance / 3 || velocity > 500) dismiss()
    else animate(offset, 0, transition)
  }

  return (
    <LayerContext value={{ dismiss }}>
      <motion.div
        data-presentation={presentation}
        className={
          push
            ? 'absolute inset-0 bg-white shadow-[-8px_0_24px_rgba(0,0,0,0.12)]'
            : 'absolute inset-x-0 bottom-0 top-[var(--sheet-top,56px)] overflow-hidden rounded-t-[12px] bg-white'
        }
        style={push ? { x: offset } : { y: offset }}
        drag={push ? 'x' : 'y'}
        dragListener={!push}
        dragControls={controls}
        dragConstraints={push ? { left: 0, right: 0 } : { top: 0, bottom: 0 }}
        dragElastic={push ? { left: 0, right: 1 } : { top: 0.05, bottom: 1 }}
        dragMomentum={false}
        onDragEnd={onDragEnd}
        exit={{ opacity: 1 }}
      >
        <Outlet />
        {push && (
          // Edge strip: swipe from the left edge to go back, like iOS.
          <div
            className="absolute inset-y-0 left-0 z-10 w-5"
            onPointerDown={(e) => controls.start(e)}
            style={{ touchAction: 'none' }}
          />
        )}
      </motion.div>
    </LayerContext>
  )
}
