import type { Transition } from 'motion/react'
import { createContext, useContext } from 'react'
import type { Device } from '@/lib/devices'
import { toTransition } from '@/lib/motion/tokens'
import type { MotionToken, MotionTokens } from '@/lib/schema'

/** Where a screen is being rendered. */
export type ScreenMode = 'canvas' | 'thumbnail' | 'focus' | 'device'

export interface FlowControls {
  /**
   * Go to another screen in the flow, by frame id or screen name. With no
   * target, follows the first connector leaving this frame. `params` reach
   * the next screen through `useFlow().params`.
   */
  navigate: (target?: string, params?: FlowParams) => void
  back: () => void
  canGoBack: boolean
  /** Params passed by the screen that navigated here. Empty on the canvas. */
  params: FlowParams
}

export type FlowParams = Record<string, string | number | boolean>

export interface ScreenContextValue {
  frameId: string
  device: Device
  mode: ScreenMode
  variant: { id: string; name: string; index: number }
  /** Code defaults merged with the active variant's overrides. */
  tokens: MotionTokens
  /** 1 = real time, 4 = four times slower. */
  timeScale: number
  /** False when the frame is off screen or shown as a still. Gate loops on it. */
  playing: boolean
  flow: FlowControls
}

const fallbackToken: MotionToken = { type: 'spring', visualDuration: 0.4, bounce: 0.15 }

export const ScreenContext = createContext<ScreenContextValue | null>(null)

function useScreenContext(hook: string): ScreenContextValue {
  const value = useContext(ScreenContext)
  if (!value) throw new Error(`${hook}() must be used inside a Springboard screen`)
  return value
}

/**
 * A Motion `transition` for one of the screen's motion tokens, with the active
 * variant and slow motion applied.
 *
 * ```tsx
 * const enter = useMotion('enter')
 * <motion.div animate={{ y: 0 }} transition={enter} />
 * ```
 */
export function useMotion(key: string): Transition {
  const { tokens, timeScale } = useScreenContext('useMotion')
  const token = tokens[key]
  if (!token && import.meta.env.DEV) {
    console.warn(
      `[springboard] Unknown motion token "${key}". Declare it in defineScreen({ motion }).`,
    )
  }
  return toTransition(token ?? fallbackToken, timeScale)
}

/** The active variant: `{ id, name, index }`. `id` is "default" for the code defaults. */
export function useVariant(): ScreenContextValue['variant'] {
  return useScreenContext('useVariant').variant
}

export function useFlow(): FlowControls {
  return useScreenContext('useFlow').flow
}

export function useDevice(): Device & { mode: ScreenMode } {
  const { device, mode } = useScreenContext('useDevice')
  return { ...device, mode }
}

export function usePlayback(): { playing: boolean; timeScale: number } {
  const { playing, timeScale } = useScreenContext('usePlayback')
  return { playing, timeScale }
}
