import { useMatches, useRouter, useRouterState } from '@tanstack/react-router'
import {
  LayoutGroup,
  MotionConfig,
  motion,
  useMotionValue,
  useTransform,
} from 'motion/react'
import {
  type CSSProperties,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react'
import { DeviceChrome } from '@/components/device/StatusBar'
import { type FromApp, readMessage, type ScreenSnapshot, type ToApp } from '@/lib/bridge'
import { getDevice } from '@/lib/devices'
import { topScreenSnapshot } from '@/lib/snapshot'
import { useProjectEntry } from '@/lib/workspace/store'
import {
  type AppMode,
  MiniAppContext,
  type MiniAppContextValue,
} from '@/runtime/app-context'
import { setVariantInUrl } from '@/runtime/screen'
import { FrameContext } from './frame-context'
import { PhoneMenu, useThreeFingerTap } from './PhoneMenu'

/**
 * Wraps every route of a project. Provides the device, safe areas, playback
 * state and a layer for sheets above the app's own UI, and draws the status
 * bar when the app isn't on a real phone.
 */
export function MiniAppHost({
  project,
  children,
}: {
  project: string
  children: ReactNode
}) {
  const frame = useContext(FrameContext)
  const entry = useProjectEntry(project)
  const router = useRouter()
  const mode: AppMode = frame ? 'frame' : window.parent !== window ? 'iframe' : 'device'

  // Settings the play page sends into the iframe.
  const [remote, setRemote] = useState<{ timeScale: number; device?: string }>({
    timeScale: 1,
  })
  const [replay, setReplay] = useState(0)

  const device = frame?.device ?? getDevice(remote.device ?? entry?.project?.device)
  const timeScale = frame?.timeScale ?? remote.timeScale
  const playing = frame?.playing ?? true
  const replayKey = (frame?.replayKey ?? 0) + replay

  const layoutScope = useId()
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null)
  const sheetProgress = useMotionValue(0)
  const scale = useTransform(sheetProgress, [0, 1], [1, 0.92])
  const radius = useTransform(sheetProgress, [0, 1], [0, 14])

  // History index → pathname, so back can tell whether history.back() really
  // returns to the parent screen.
  const log = useRef(new Map<number, string>())
  const location = useRouterState({ select: (s) => s.location })
  const historyIndex = (location.state as { __TSR_index?: number }).__TSR_index ?? 0
  log.current.set(historyIndex, location.pathname)
  const previousPathname = useCallback(() => {
    const i = (router.state.location.state as { __TSR_index?: number }).__TSR_index ?? 0
    return log.current.get(i - 1)
  }, [router])

  const context = useMemo<MiniAppContextValue>(
    () => ({
      project,
      device,
      mode,
      timeScale,
      playing,
      portalTarget,
      sheetProgress,
      previousPathname,
    }),
    [
      project,
      device,
      mode,
      timeScale,
      playing,
      portalTarget,
      sheetProgress,
      previousPathname,
    ],
  )

  const screen = useTopScreen(project)

  // On a phone or in the play iframe, the app owns the whole page.
  useEffect(() => {
    if (mode === 'frame') return
    document.documentElement.classList.add('pl-standalone')
    return () => document.documentElement.classList.remove('pl-standalone')
  }, [mode])
  const onDevice = mode === 'device'
  const style = {
    '--safe-top': onDevice ? 'env(safe-area-inset-top)' : `${device.safeArea.top}px`,
    '--safe-right': onDevice
      ? 'env(safe-area-inset-right)'
      : `${device.safeArea.right}px`,
    '--safe-bottom': onDevice
      ? 'env(safe-area-inset-bottom)'
      : `${device.safeArea.bottom}px`,
    '--safe-left': onDevice ? 'env(safe-area-inset-left)' : `${device.safeArea.left}px`,
  } as CSSProperties

  return (
    <MiniAppContext value={context}>
      <div
        className="pl-app relative isolate h-full w-full overflow-hidden bg-black text-left text-neutral-900"
        style={style}
        data-paused={playing ? undefined : ''}
      >
        <motion.div
          className="absolute inset-0 origin-center overflow-hidden bg-white"
          style={{ scale, borderRadius: radius }}
        >
          <MotionConfig reducedMotion="user" skipAnimations={!playing}>
            {/* layoutId is page-wide in Motion. Several copies of an app share
                a page on boards and thumbnails, so each gets its own scope. */}
            <LayoutGroup id={layoutScope}>
              <div key={replayKey} className="h-full">
                {children}
              </div>
            </LayoutGroup>
          </MotionConfig>
        </motion.div>
        <div
          ref={setPortalTarget}
          className="pointer-events-none absolute inset-0 z-[80] [&>*]:pointer-events-auto"
        />
        {!onDevice && (
          <DeviceChrome device={device} tone={screen?.statusBar ?? 'dark'} statusBar />
        )}
        {mode === 'iframe' && (
          <IframeBridge
            screen={screen}
            onSettings={setRemote}
            onReplay={() => setReplay((r) => r + 1)}
          />
        )}
        {onDevice && <DeviceMenu project={project} screen={screen} />}
      </div>
    </MiniAppContext>
  )
}

/** The deepest matched route that declares `staticData.screen`. */
function useTopScreen(project: string): ScreenSnapshot | null {
  const matches = useMatches()
  return useMemo(() => topScreenSnapshot(matches, project), [matches, project])
}

type TopScreen = ScreenSnapshot | null

function post(message: FromApp) {
  window.parent.postMessage(message, window.location.origin)
}

const forwardedKeys = new Set([
  'r',
  's',
  'i',
  'escape',
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
])

/** In the play page's iframe: report where the app is, accept settings. */
function IframeBridge({
  screen,
  onSettings,
  onReplay,
}: {
  screen: TopScreen
  onSettings: (s: { timeScale: number; device?: string }) => void
  onReplay: () => void
}) {
  const router = useRouter()
  const href = useRouterState({ select: (s) => s.location.href })

  useEffect(() => {
    post({ type: 'pl:state', href, screen })
  }, [href, screen])

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const message = readMessage<ToApp>(event)
      if (!message) return
      if (message.type === 'pl:settings')
        onSettings({ timeScale: message.timeScale, device: message.device })
      if (message.type === 'pl:replay') onReplay()
      if (message.type === 'pl:variant') setVariantInUrl(router, message.key, message.id)
    }
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      if (target.closest('input, textarea, select, [contenteditable]')) return
      if (event.metaKey || event.ctrlKey || event.altKey) return
      const key = event.key.toLowerCase()
      if (forwardedKeys.has(key)) post({ type: 'pl:key', key })
    }
    window.addEventListener('message', onMessage)
    window.addEventListener('keydown', onKey)
    post({ type: 'pl:ready' })
    return () => {
      window.removeEventListener('message', onMessage)
      window.removeEventListener('keydown', onKey)
    }
  }, [router, onSettings, onReplay])

  return null
}

/** On a real phone: hidden menu on three-finger tap or ⌘/Ctrl + . */
function DeviceMenu({ project, screen }: { project: string; screen: TopScreen }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const openRef = useRef(open)
  openRef.current = open
  useThreeFingerTap(() => setOpen((o) => !o))

  const exit = useCallback(() => {
    void router.navigate({ to: '/p/$project', params: { project } } as never)
  }, [router, project])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === '.') {
        event.preventDefault()
        setOpen((o) => !o)
      } else if (event.key === 'Escape') {
        if (openRef.current) setOpen(false)
        else exit()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
    }
  }, [exit])

  return (
    <PhoneMenu
      open={open}
      title={screen?.name ?? 'Preview'}
      variants={screen?.variants ?? []}
      variantId={screen?.variantId ?? 'default'}
      onVariant={(id) => screen && setVariantInUrl(router, screen.key, id)}
      onClose={() => setOpen(false)}
      onExit={exit}
    />
  )
}
