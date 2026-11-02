import type { ComponentType } from 'react'
import type { MotionTokens } from '@/lib/schema'

export interface VariantDefinition {
  /** Shown in the variant switcher, e.g. "Soft spring". */
  name: string
  /** Overrides for the screen's motion tokens. Missing keys keep the default. */
  motion?: Partial<MotionTokens>
}

export interface ScreenDefinition {
  /** Display name, shown above the frame unless the canvas overrides it. */
  name: string
  /**
   * Named motion tokens with their default values. Read them with
   * `useMotion(key)`. The handoff panel exports them to Motion, SwiftUI and
   * Jetpack Compose.
   */
  motion: MotionTokens
  /**
   * Alternative timings to compare side by side, written in code. The default
   * (the `motion` values above) is always variant 01. Keys become the variant
   * id used in URLs and in `useVariant().id`. Variants saved in canvas.json
   * are listed after these.
   *
   * ```ts
   * variants: {
   *   'soft-spring': { name: 'Soft spring', motion: { enter: spring(0.7, 0.35) } },
   * }
   * ```
   */
  variants?: Record<string, VariantDefinition>
  /** Colour of the status bar's text and icons. Defaults to dark. */
  statusBar?: 'dark' | 'light'
  component: ComponentType
}

const marker = Symbol.for('springboard.screen')

export type DefinedScreen = ScreenDefinition & { [marker]: true }

/**
 * Declares a screen. A screen file default-exports the result:
 *
 * ```tsx
 * export default defineScreen({
 *   name: 'Home',
 *   motion: { enter: spring(0.4, 0.2) },
 *   component: Home,
 * })
 * ```
 */
export function defineScreen(definition: ScreenDefinition): DefinedScreen {
  return { statusBar: 'dark', ...definition, [marker]: true }
}

export function isScreen(value: unknown): value is DefinedScreen {
  return typeof value === 'object' && value !== null && marker in value
}
