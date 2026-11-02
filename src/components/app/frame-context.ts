import { createContext } from 'react'
import type { Device } from '@/lib/devices'

/**
 * Set by a board frame or thumbnail around its own router, so the mini app
 * inside knows it's one frame among several, not the whole page.
 */
export interface FrameSettings {
  device: Device
  playing: boolean
  timeScale: number
  replayKey: number
}

export const FrameContext = createContext<FrameSettings | null>(null)
