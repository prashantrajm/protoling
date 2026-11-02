import { create } from 'zustand'

/**
 * Editor preferences and playback controls, shared by every surface.
 * Theme is persisted; index.html applies it before first paint.
 */

export type Theme = 'light' | 'dark' | 'system'

const themeKey = 'protoling:theme'
/** How much slower slow motion runs. */
export const slowMotionFactor = 4

interface EditorState {
  theme: Theme
  setTheme: (theme: Theme) => void
  slowMotion: boolean
  toggleSlowMotion: () => void
  /** Bumped to replay every visible screen. */
  replayTick: number
  replayAll: () => void
  commandOpen: boolean
  setCommandOpen: (open: boolean) => void
  phoneDialogOpen: boolean
  setPhoneDialogOpen: (open: boolean) => void
}

function readTheme(): Theme {
  if (typeof localStorage === 'undefined') return 'system'
  const saved = localStorage.getItem(themeKey)
  return saved === 'light' || saved === 'dark' ? saved : 'system'
}

const darkQuery =
  typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)') : null

export function resolvedTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') return darkQuery?.matches ? 'dark' : 'light'
  return theme
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', resolvedTheme(theme) === 'dark')
}

export const useEditor = create<EditorState>((set, get) => ({
  theme: readTheme(),
  setTheme: (theme) => {
    if (theme === 'system') localStorage.removeItem(themeKey)
    else localStorage.setItem(themeKey, theme)
    applyTheme(theme)
    set({ theme })
  },
  slowMotion: false,
  toggleSlowMotion: () => set({ slowMotion: !get().slowMotion }),
  replayTick: 0,
  replayAll: () => set({ replayTick: get().replayTick + 1 }),
  commandOpen: false,
  setCommandOpen: (commandOpen) => set({ commandOpen }),
  phoneDialogOpen: false,
  setPhoneDialogOpen: (phoneDialogOpen) => set({ phoneDialogOpen }),
}))

darkQuery?.addEventListener('change', () => {
  if (useEditor.getState().theme === 'system') applyTheme('system')
})

export function useTimeScale(): number {
  return useEditor((s) => (s.slowMotion ? slowMotionFactor : 1))
}

/** Follows the OS "reduce motion" setting. */
export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}
