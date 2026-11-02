import type { MotionToken, MotionTokens } from '@/lib/schema'

/** How a route appears when its parent navigates to it. */
export type Presentation = 'push' | 'sheet' | 'fullScreen'

export interface ScreenVariant {
  /** Shown in variant switchers, e.g. "Soft spring". */
  name: string
  /** Overrides for this screen's motion tokens. Missing keys keep the default. */
  motion?: Partial<MotionTokens>
}

export interface ScreenMeta {
  /** Display name in boards, the inspector and menus. */
  name: string
  /** Named timings for this screen. Read them with `useMotion(key)`. */
  motion?: MotionTokens
  /** Alternative timings to compare. Variant 01 is always the defaults above. */
  variants?: Record<string, ScreenVariant>
  /** Colour of the drawn status bar while this screen is on top. Defaults to dark. */
  statusBar?: 'dark' | 'light'
}

declare module '@tanstack/react-router' {
  interface StaticDataRouteOption {
    /**
     * Marks the route as a screen: it gets a name, motion tokens and
     * variants, and appears on boards and in the inspector.
     */
    screen?: ScreenMeta
    /** How this route appears over its parent. Needs the parent to render <StackScreen>. */
    presentation?: Presentation
    /** Transition used to present and dismiss it. Exported as handoff. */
    transition?: MotionToken
  }
}
