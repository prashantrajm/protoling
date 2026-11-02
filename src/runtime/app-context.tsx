import type { MotionValue } from 'motion/react'
import { createContext, useContext } from 'react'
import type { Device } from '@/lib/devices'

/** Where the mini app is running. */
export type AppMode =
  /** Opened directly on a phone-sized screen: real viewport, real safe areas. */
  | 'device'
  /** Opened directly in a desktop browser: shown alone in a phone frame. */
  | 'present'
  /** In the desktop play view's iframe, at exact device size. */
  | 'iframe'
  /** One of several frames on a board or thumbnail, in the same page. */
  | 'frame'

export interface MiniAppContextValue {
  project: string
  device: Device
  mode: AppMode
  /** 1 = real time, 4 = four times slower. */
  timeScale: number
  /** False for still thumbnails and paused frames. Gate loops on it. */
  playing: boolean
  /** Element sheets and full-screen modals render into, above tab bars. */
  portalTarget: HTMLElement | null
  /** 0–1: how far a sheet covers the app. The app behind scales down with it. */
  sheetProgress: MotionValue<number>
  /** Pathname of the previous history entry, if this session made it. */
  previousPathname: () => string | undefined
}

export const MiniAppContext = createContext<MiniAppContextValue | null>(null)

export function useMiniApp(hook = 'This hook'): MiniAppContextValue {
  const value = useContext(MiniAppContext)
  if (!value) throw new Error(`${hook} must be used inside a project's app/ routes`)
  return value
}

/** The previewed device, its safe areas, and where the app is running. */
export function useDevice(): Device & { mode: AppMode } {
  const { device, mode } = useMiniApp('useDevice()')
  return { ...device, mode }
}

/** `playing` is false for still thumbnails. Gate looping animations on it. */
export function usePlayback(): { playing: boolean; timeScale: number } {
  const { playing, timeScale } = useMiniApp('usePlayback()')
  return { playing, timeScale }
}
