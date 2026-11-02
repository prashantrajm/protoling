/**
 * Everything a project's routes need from Springboard. Routes are plain
 * TanStack Router files; this adds native-style presentation, motion tokens
 * and variants on top.
 */
import './types'

export { spring, tween } from '@/lib/motion/tokens'
export type { MotionToken, MotionTokens } from '@/lib/schema'
export type { AppMode } from './app-context'
export { useDevice, usePlayback } from './app-context'
export type { BoardDefinition, BoardFrame } from './board'
export { defineBoard } from './board'
export type { VariantInfo } from './screen'
export { useMotion, useVariant } from './screen'
export { StackScreen, useDismiss } from './stack'
export { useTabs } from './tabs'
export type { Presentation, ScreenMeta, ScreenVariant } from './types'
