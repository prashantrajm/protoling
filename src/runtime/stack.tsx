/**
 * Native-style navigation on plain TanStack Router.
 *
 * A stack is nested routes: at /orbit/today/detail both "today" and "detail"
 * are matched, so the screen underneath stays mounted like a native
 * navigation stack. A screen that can present others renders its content in
 * <StackScreen>, which layers the matched child route on top according to the
 * child's `staticData.presentation`.
 *
 * Going back animates first, then navigates. TanStack's route hooks throw
 * once their route is no longer matched, so a screen can't animate out after
 * navigation. Animating first also makes edge swipe-back interactive.
 */
import { Outlet, useMatch, useMatches, useRouter } from '@tanstack/react-router'
import {
  AnimatePresence,
  animate,
  type MotionValue,
  motion,
  type PanInfo,
  type Transition,
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
import { createPortal } from 'react-dom'
import { toTransition } from '@/lib/motion/tokens'
import type { MotionToken } from '@/lib/schema'
import { useMiniApp } from './app-context'
import type { Presentation } from './types'

export const defaultPresentTransition: MotionToken = {
  type: 'spring',
  visualDuration: 0.45,
  bounce: 0,
}

const LayerContext = createContext<{ dismiss: () => void } | null>(null)

/**
 * Dismisses the screen that's on top: plays its push, sheet or full-screen
 * animation in reverse, then navigates back to the screen underneath.
 */
export function useDismiss(): () => void {
  const layer = useContext(LayerContext)
  const router = useRouter()
  return layer?.dismiss ?? (() => router.history.back())
}

export function StackScreen({ children }: { children: ReactNode }) {
  const app = useMiniApp('<StackScreen>')
  const router = useRouter()
  const current = useMatch({ strict: false })
  const matches = useMatches()
  const index = matches.findIndex((m) => m.id === current.id)
  const child = index >= 0 ? matches[index + 1] : undefined

  const box = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: app.device.width, height: app.device.height })
  useLayoutEffect(() => {
    const el = box.current
    if (!el) return
    const update = () => setSize({ width: el.clientWidth, height: el.clientHeight })
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const presentation: Presentation = child?.staticData?.presentation ?? 'push'
  const token = child?.staticData?.transition ?? defaultPresentTransition
  const tokenKey = JSON.stringify(token)
  // Stable identity: a new object every render would restart running animations.
  // biome-ignore lint/correctness/useExhaustiveDependencies: keyed on the token's value
  const transition = useMemo(
    () => toTransition(token, app.timeScale),
    [tokenKey, app.timeScale],
  )

  // Only pushes move the parent; sheets move the whole app via sheetProgress.
  const progress = useMotionValue(0)
  const parentX = useTransform(progress, [0, 1], [0, -size.width * 0.3])
  const parentDim = useTransform(progress, [0, 1], [0, 0.12])

  // Back initiated by the browser, not by dismiss(): settle the parent.
  useEffect(() => {
    if (!child) {
      animate(progress, 0, transition)
      app.sheetProgress.set(0)
    }
  }, [child, progress, transition, app.sheetProgress])

  const goBack = useCallback(() => {
    const parent = current.pathname
    if (router.history.canGoBack() && app.previousPathname() === parent)
      router.history.back()
    else
      void router.navigate({
        to: parent,
        // Keep only the params the parent's routes validate: Today keeps ?v=
        // but not Detail's ?task=, while Detail keeps ?task= when a sheet on
        // top of it closes. `_strictSearch` is TanStack's per-match record of
        // exactly those; if it ever goes away, the root still keeps ?v=.
        search: (current as { _strictSearch?: object })._strictSearch ?? {},
        replace: true,
      } as never)
  }, [router, current.pathname, app])

  const layer = child && (
    <Layer
      key={child.id}
      presentation={presentation}
      size={
        presentation === 'push'
          ? size
          : { width: app.device.width, height: rootHeight(app) }
      }
      progress={presentation === 'push' ? progress : app.sheetProgress}
      transition={transition}
      onDismissed={goBack}
    />
  )

  return (
    <div ref={box} className="relative h-full overflow-hidden">
      <motion.div className="absolute inset-0 overflow-hidden" style={{ x: parentX }}>
        {children}
        <motion.div
          className="pointer-events-none absolute inset-0 bg-black"
          style={{ opacity: parentDim }}
        />
      </motion.div>
      {presentation === 'push' ? (
        <AnimatePresence initial={false}>{layer}</AnimatePresence>
      ) : (
        app.portalTarget &&
        createPortal(
          <AnimatePresence initial={false}>{layer}</AnimatePresence>,
          app.portalTarget,
        )
      )}
    </div>
  )
}

function rootHeight(app: {
  portalTarget: HTMLElement | null
  device: { height: number }
}) {
  return app.portalTarget?.clientHeight || app.device.height
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
  transition: Transition
  onDismissed: () => void
}) {
  const push = presentation === 'push'
  const distance = push ? size.width : size.height
  const offset = useMotionValue(distance)
  const controls = useDragControls()
  const dismissing = useRef(false)

  // Keep progress (which drives what's underneath) in step with this layer.
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

  const sheet = presentation === 'sheet'
  const dim = useTransform(progress, [0, 1], [0, sheet ? 0.35 : 0])

  return (
    <LayerContext value={{ dismiss }}>
      {sheet && (
        <motion.button
          type="button"
          aria-label="Dismiss"
          className="absolute inset-0 z-[90] bg-black"
          style={{ opacity: dim }}
          onClick={dismiss}
        />
      )}
      <motion.div
        data-presentation={presentation}
        className={
          push
            ? 'absolute inset-0 z-10 bg-white shadow-[-8px_0_24px_rgba(0,0,0,0.12)]'
            : sheet
              ? 'absolute inset-x-0 bottom-0 z-[91] overflow-hidden rounded-t-[12px] bg-white'
              : 'absolute inset-0 z-[91] overflow-hidden bg-white'
        }
        style={{
          ...(push ? { x: offset } : { y: offset }),
          ...(sheet ? { top: 'calc(var(--safe-top) + 10px)' } : {}),
        }}
        drag={push ? 'x' : sheet ? 'y' : false}
        dragListener={sheet}
        dragControls={controls}
        dragConstraints={push ? { left: 0, right: 0 } : { top: 0, bottom: 0 }}
        dragElastic={push ? { left: 0, right: 1 } : { top: 0.05, bottom: 1 }}
        dragMomentum={false}
        onDragEnd={onDragEnd}
      >
        <Outlet />
        {push && (
          // Swipe from the left edge to go back, like iOS.
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
