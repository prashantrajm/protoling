import { useEffect, useState } from 'react'
import type { DefinedScreen } from '@/runtime/screen'
import { isScreen } from '@/runtime/screen'
import { type ScreenLoader, useWorkspace } from './store'

export type LoadedScreen =
  | { ok: true; screen: DefinedScreen }
  | { ok: false; error: string }

declare global {
  var __springboardScreens: Map<string, Promise<LoadedScreen>> | undefined
}

// Survives HMR of this module, so unchanged screens never remount.
globalThis.__springboardScreens ??= new Map<string, Promise<LoadedScreen>>()
const cache = globalThis.__springboardScreens

export function screenPath(project: string, canvas: string, screen: string): string {
  return `/projects/${project}/canvases/${canvas}/screens/${screen}.tsx`
}

/**
 * Identifies the current version of a screen file. After a screen changes,
 * Vite adds `?t=` to its import URL, so only that loader's source changes.
 * Keying on it remounts exactly the screen that was edited.
 */
export function screenVersion(
  path: string,
  loader: ScreenLoader | undefined,
): string | null {
  return loader ? `${path}#${loader.toString()}` : null
}

export function loadScreen(
  path: string,
  loader: ScreenLoader | undefined,
): Promise<LoadedScreen> {
  const version = screenVersion(path, loader)
  if (!loader || !version) {
    return Promise.resolve({ ok: false, error: `Screen file not found: ${path}` })
  }
  let promise = cache.get(version)
  if (!promise) {
    promise = loader()
      .then(
        (mod): LoadedScreen =>
          isScreen(mod.default)
            ? { ok: true, screen: mod.default }
            : { ok: false, error: `${path} must \`export default defineScreen({...})\`` },
      )
      .catch((error: unknown) => ({
        ok: false as const,
        error: error instanceof Error ? error.message : String(error),
      }))
    cache.set(version, promise)
  }
  return promise
}

/** The loader for a screen; changes identity whenever the registry reloads. */
export function useScreenLoader(path: string): ScreenLoader | undefined {
  return useWorkspace((s) => s.loaders[path])
}

/** The loaded screen definition, or null while loading. For UI around a screen. */
export function useLoadedScreen(
  project: string,
  canvas: string,
  screen: string,
): LoadedScreen | null {
  const path = screenPath(project, canvas, screen)
  const loader = useScreenLoader(path)
  const [loaded, setLoaded] = useState<LoadedScreen | null>(null)
  useEffect(() => {
    let cancelled = false
    loadScreen(path, loader).then((result) => {
      if (!cancelled) setLoaded(result)
    })
    return () => {
      cancelled = true
    }
  }, [path, loader])
  return loaded
}
