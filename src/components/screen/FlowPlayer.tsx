import { AnimatePresence, motion, type Transition, type Variants } from 'motion/react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { getDevice } from '@/lib/devices'
import { resolveNavigation } from '@/lib/flow'
import { toTransition } from '@/lib/motion/tokens'
import type { Canvas, Connector, ConnectorAnimation } from '@/lib/schema'
import type { FlowParams, ScreenMode } from '@/runtime/context'
import { ScreenHost } from './ScreenHost'

interface Entry {
  frameId: string
  params: FlowParams
  /** Connector that led here; its animation also plays in reverse on back. */
  via: Connector | null
  key: number
}

export interface FlowPlayerProps {
  project: string
  canvasSlug: string
  canvas: Canvas
  startFrame: string
  /** Chosen variant per frame id. Frames not listed use their default. */
  variants?: Record<string, string>
  mode: Extract<ScreenMode, 'focus' | 'device'>
  timeScale?: number
  replayKey?: number
  onFrameChange?: (frameId: string) => void
}

const fallback: Connector = {
  id: 'direct',
  from: '',
  to: '',
  animation: 'push',
  transition: { type: 'spring', visualDuration: 0.45, bounce: 0 },
}

/**
 * Plays a canvas as a flow: screens stack as they navigate, and the
 * connector's animation runs forwards on navigate and backwards on back.
 * All screens share one layout scope, so layoutId transitions carry across.
 */
export function FlowPlayer(props: FlowPlayerProps) {
  const { canvas, startFrame, onFrameChange } = props
  const [counter, setCounter] = useState(1)
  const [stack, setStack] = useState<Entry[]>([
    { frameId: startFrame, params: {}, via: null, key: 0 },
  ])
  const [direction, setDirection] = useState<1 | -1>(1)
  /** The connector animating right now (the popped one when going back). */
  const [active, setActive] = useState<Connector | null>(null)

  // Restart from the requested frame when it, or the replay key, changes.
  // biome-ignore lint/correctness/useExhaustiveDependencies: replayKey is a deliberate trigger
  useEffect(() => {
    setStack([{ frameId: startFrame, params: {}, via: null, key: 0 }])
    setActive(null)
  }, [startFrame, props.replayKey])

  const current = stack[stack.length - 1]

  useEffect(() => {
    onFrameChange?.(current.frameId)
  }, [current.frameId, onFrameChange])

  const navigate = useCallback(
    (from: string, target?: string, params: FlowParams = {}) => {
      const result = resolveNavigation(canvas, from, target)
      if (!result) {
        console.warn(`[springboard] Nothing to navigate to from "${from}"`, target ?? '')
        return
      }
      setDirection(1)
      setActive(result.connector ?? fallback)
      setCounter((c) => c + 1)
      setStack((s) => [
        ...s,
        {
          frameId: result.frame.id,
          params,
          via: result.connector ?? fallback,
          key: counter,
        },
      ])
    },
    [canvas, counter],
  )

  const back = useCallback(() => {
    if (stack.length < 2) return
    setDirection(-1)
    setActive(stack[stack.length - 1].via)
    setStack(stack.slice(0, -1))
  }, [stack])

  const connector = active ?? fallback
  // Exiting layers keep their last props, but receive AnimatePresence's
  // latest `custom`. Everything that depends on the current move goes there.
  const custom: Move = {
    direction,
    animation: connector.animation,
    transition: toTransition(connector.transition, props.timeScale ?? 1),
  }

  return (
    <div className="relative size-full overflow-hidden bg-black">
      <AnimatePresence initial={false} custom={custom}>
        <Layer
          key={current.key}
          entry={current}
          depth={stack.length}
          custom={custom}
          player={props}
          navigate={navigate}
          back={back}
        />
      </AnimatePresence>
    </div>
  )
}

interface Move {
  direction: 1 | -1
  animation: ConnectorAnimation
  transition: Transition
}

function Layer({
  entry,
  depth,
  custom,
  player,
  navigate,
  back,
}: {
  entry: Entry
  depth: number
  custom: Move
  player: FlowPlayerProps
  navigate: (from: string, target?: string, params?: FlowParams) => void
  back: () => void
}) {
  const frame = player.canvas.frames.find((f) => f.id === entry.frameId)
  const flow = useMemo(
    () => ({
      navigate: (target?: string, params?: FlowParams) =>
        navigate(entry.frameId, target, params),
      back,
      canGoBack: depth > 1,
      params: entry.params,
    }),
    [back, depth, entry.frameId, entry.params, navigate],
  )
  if (!frame) return null
  const device = getDevice(frame.device ?? player.canvas.device)

  return (
    <motion.div
      className="absolute inset-0"
      custom={custom}
      variants={layerVariants}
      initial="enter"
      animate="center"
      exit="exit"
      style={{ zIndex: depth }}
    >
      <ScreenHost
        project={player.project}
        canvas={player.canvasSlug}
        frame={frame}
        device={device}
        mode={player.mode}
        variantId={player.variants?.[entry.frameId]}
        timeScale={player.timeScale}
        layoutScope="flow"
        flow={flow}
      />
    </motion.div>
  )
}

const rest = { x: '0%', y: '0%', scale: 1, opacity: 1, filter: 'brightness(1)' }

/**
 * Enter and exit for each connector animation, resolved from `custom` so an
 * exiting layer animates with the move that's happening now.
 */
const layerVariants: Variants = {
  enter: ({ direction, animation, transition }: Move) => {
    const forward = direction > 0
    switch (animation) {
      case 'push':
        return { ...rest, x: forward ? '100%' : '-30%', transition }
      case 'modal':
        return {
          ...rest,
          y: forward ? '100%' : '0%',
          scale: forward ? 1 : 0.94,
          transition,
        }
      case 'fade':
        return { ...rest, opacity: 0, transition }
      case 'none':
        return { ...rest, transition: { duration: 0 } }
    }
  },
  center: ({ animation, transition }: Move) => ({
    ...rest,
    transition: animation === 'none' ? { duration: 0 } : transition,
  }),
  exit: ({ direction, animation, transition }: Move) => {
    const forward = direction > 0
    // Going back, the leaving screen is on top; going forward, underneath.
    const zIndex = forward ? 0 : 999
    switch (animation) {
      case 'push':
        return {
          x: forward ? '-30%' : '100%',
          filter: forward ? 'brightness(0.85)' : 'brightness(1)',
          zIndex,
          transition,
        }
      case 'modal':
        return {
          y: forward ? '0%' : '100%',
          scale: forward ? 0.94 : 1,
          zIndex,
          transition,
        }
      case 'fade':
        return { opacity: 0, zIndex, transition }
      case 'none':
        return { opacity: 0, transition: { duration: 0 } }
    }
  },
}
