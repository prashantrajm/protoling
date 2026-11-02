import { createFileRoute, Link, notFound, useNavigate } from '@tanstack/react-router'
import {
  ChevronLeft,
  ExternalLink,
  Link2,
  Maximize,
  Minimize,
  PanelRight,
  RotateCcw,
  Share,
  Smartphone,
  Snail,
} from 'lucide-react'
import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import { Inspector } from '@/components/inspector/Inspector'
import { VariantSwitcher } from '@/components/preview/VariantSwitcher'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Kbd } from '@/components/ui/kbd'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { type FromApp, readMessage, type ScreenSnapshot, type ToApp } from '@/lib/bridge'
import { deviceIds, devices, getDevice } from '@/lib/devices'
import { useEditor, useTimeScale } from '@/lib/editor'
import { appPath, copyPreviewLink, openPreview } from '@/lib/preview-link'
import { fileForRoute } from '@/lib/screens'
import { cn } from '@/lib/utils'
import { findProject, useProjectEntry, useWorkspace } from '@/lib/workspace/store'

/**
 * Play: the whole app running on a phone frame. The app is an iframe at the
 * exact device size, so its viewport, history and fixed positioning behave
 * as on a phone. The page URL follows the app, so any state is a link.
 */
export const Route = createFileRoute('/_app/p/$project/play/$')({
  beforeLoad: ({ params }) => {
    const entry = findProject(useWorkspace.getState().projects, params.project)
    if (!entry?.hasApp) throw notFound()
  },
  component: PlayPage,
})

function PlayPage() {
  const { project, _splat } = Route.useParams()
  const entry = useProjectEntry(project)
  const navigate = useNavigate()
  const iframe = useRef<HTMLIFrameElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)
  const [screen, setScreen] = useState<ScreenSnapshot | null>(null)
  const [deviceId, setDeviceId] = useState(entry?.project?.device ?? 'iphone-17-pro')
  const [scale, setScale] = useState(1)
  const [fullscreen, setFullscreen] = useState(false)
  const [inspector, setInspector] = useState(true)

  const timeScale = useTimeScale()
  const slowMotion = useEditor((s) => s.slowMotion)
  const toggleSlowMotion = useEditor((s) => s.toggleSlowMotion)
  const replayAll = useEditor((s) => s.replayAll)
  const replayTick = useEditor((s) => s.replayTick)
  const openPhone = useEditor((s) => s.setPhoneDialogOpen)
  const device = getDevice(deviceId)

  // The iframe loads once; after that the app navigates itself and reports back.
  const [src] = useState(() => `/${project}/${_splat ?? ''}${window.location.search}`)

  const send = useCallback((message: ToApp) => {
    iframe.current?.contentWindow?.postMessage(message, window.location.origin)
  }, [])

  useEffect(() => {
    if (ready) send({ type: 'pl:settings', timeScale, device: deviceId })
  }, [ready, send, timeScale, deviceId])

  const firstTick = useRef(replayTick)
  useEffect(() => {
    if (replayTick !== firstTick.current) send({ type: 'pl:replay' })
  }, [replayTick, send])

  const backToProject = useCallback(
    () => navigate({ to: '/p/$project', params: { project } }),
    [navigate, project],
  )
  const chooseVariant = useCallback(
    (id: string) => screen && send({ type: 'pl:variant', key: screen.key, id }),
    [screen, send],
  )

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const message = readMessage<FromApp>(event)
      if (!message) return
      if (message.type === 'pl:ready') setReady(true)
      if (message.type === 'pl:state') {
        setScreen(message.screen)
        // Mirror the app's location in the page URL, so it can be shared.
        const url = new URL(message.href, window.location.origin)
        const inside = url.pathname.replace(new RegExp(`^/${project}/?`), '')
        if (inside !== (_splat ?? '') || url.search !== window.location.search) {
          void navigate({
            to: '/p/$project/play/$',
            params: { project, _splat: inside },
            search: Object.fromEntries(url.searchParams) as never,
            replace: true,
          })
        }
      }
      if (message.type === 'pl:key') {
        const { key } = message
        if (key === 'r') replayAll()
        else if (key === 's') toggleSlowMotion()
        else if (key === 'i') setInspector((v) => !v)
        else if (key === 'escape') void backToProject()
        else if (/^[1-9]$/.test(key) && screen) {
          const option = screen.variants[Number(key) - 1]
          if (option) chooseVariant(option.id)
        }
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [
    project,
    _splat,
    navigate,
    replayAll,
    toggleSlowMotion,
    backToProject,
    screen,
    chooseVariant,
  ])

  useHotkeys('escape', () => void backToProject(), { enabled: !fullscreen }, [
    backToProject,
    fullscreen,
  ])
  useHotkeys('i', () => setInspector((v) => !v))
  useHotkeys(
    '1,2,3,4,5,6,7,8,9',
    (e) => {
      const option = screen?.variants[Number(e.key) - 1]
      if (option) chooseVariant(option.id)
    },
    [screen, chooseVariant],
  )

  // Fit the phone, never past 1:1. Leave room for the label row.
  useEffect(() => {
    const el = stage.current
    if (!el) return
    const observer = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect
      setScale(Math.min(1, (height - 96) / device.height, (width - 48) / device.width))
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [device.height, device.width])

  useEffect(() => {
    const onChange = () => setFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  const name = entry?.project?.name ?? project

  return (
    <div className="flex h-full">
      <div className="flex min-w-0 flex-1 flex-col bg-canvas">
        <header className="flex items-center justify-between gap-3 px-4 py-3">
          <Link
            to="/p/$project"
            params={{ project }}
            className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
          >
            <ChevronLeft className="size-4" />
            {name}
          </Link>
          <div className="flex items-center gap-1">
            <Select value={deviceId} onValueChange={setDeviceId}>
              <SelectTrigger size="sm" className="w-44 bg-background" aria-label="Device">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {deviceIds.map((id) => (
                  <SelectItem key={id} value={id}>
                    {devices[id].name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <HeaderButton label="Replay" shortcut="R" onClick={replayAll}>
              <RotateCcw />
            </HeaderButton>
            <HeaderButton
              label="Slow motion"
              shortcut="S"
              onClick={toggleSlowMotion}
              active={slowMotion}
            >
              <Snail />
            </HeaderButton>
            <SharePreview
              path={() => appPath(project, _splat ?? '', window.location.search)}
            />
            <HeaderButton label="Open on phone" onClick={() => openPhone(true)}>
              <Smartphone />
            </HeaderButton>
            <HeaderButton
              label={fullscreen ? 'Exit full screen' : 'Full screen'}
              onClick={() =>
                fullscreen
                  ? void document.exitFullscreen()
                  : void document.documentElement.requestFullscreen()
              }
            >
              {fullscreen ? <Minimize /> : <Maximize />}
            </HeaderButton>
            <HeaderButton
              label="Inspector"
              shortcut="I"
              onClick={() => setInspector((v) => !v)}
              active={inspector}
            >
              <PanelRight />
            </HeaderButton>
          </div>
        </header>

        <div ref={stage} className="flex min-h-0 flex-1 items-center justify-center">
          <div style={{ width: device.width * scale }}>
            <div className="mb-2 flex items-center justify-between px-1">
              <span className="text-[15px] font-medium text-frame-label">
                {screen?.name ?? name}
              </span>
              {screen && (
                <VariantSwitcher
                  options={screen.variants}
                  value={screen.variantId}
                  align="end"
                  onChange={chooseVariant}
                />
              )}
            </div>
            <div
              className="overflow-hidden shadow-[0_0_0_1px_var(--frame-border),0_12px_40px_rgba(0,0,0,0.08)]"
              style={{
                width: device.width * scale,
                height: device.height * scale,
                borderRadius: device.radius * scale,
              }}
            >
              <iframe
                ref={iframe}
                src={src}
                title={`${name} running on ${device.name}`}
                className="block origin-top-left border-0"
                style={{
                  width: device.width,
                  height: device.height,
                  transform: `scale(${scale})`,
                }}
              />
            </div>
            <p className="mt-3 text-center text-[13px] text-muted-foreground">
              <Kbd>R</Kbd> replay · <Kbd>S</Kbd> slow motion · <Kbd>1</Kbd>–<Kbd>9</Kbd>{' '}
              variants · <Kbd>Esc</Kbd> back
            </p>
          </div>
        </div>
      </div>
      {inspector && (
        <Inspector
          screen={screen}
          file={screen ? fileForRoute(screen.routeId, project) : null}
          onVariant={chooseVariant}
        />
      )}
    </div>
  )
}

function HeaderButton({
  label,
  shortcut,
  onClick,
  active,
  children,
}: {
  label: string
  shortcut?: string
  onClick: () => void
  active?: boolean
  children: ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          aria-label={label}
          aria-pressed={active}
          className={cn(
            'grid size-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground [&_svg]:size-[18px]',
            active && 'bg-brand-soft text-brand',
          )}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent className="flex items-center gap-2">
        {label}
        {shortcut && <Kbd>{shortcut}</Kbd>}
      </TooltipContent>
    </Tooltip>
  )
}

/**
 * Share: the app on its own at this site's address, for anyone to open.
 * The path is read when you click, so it's always the screen and variant on
 * the phone right now.
 */
function SharePreview({ path }: { path: () => string }) {
  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger
            aria-label="Share preview"
            className="grid size-9 place-items-center rounded-lg text-muted-foreground outline-none transition-colors hover:bg-foreground/5 hover:text-foreground focus-visible:ring-2 focus-visible:ring-brand [&_svg]:size-[18px]"
          >
            <Share />
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>Share preview</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onSelect={() => void copyPreviewLink(path())}>
          <Link2 />
          Copy preview link
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => openPreview(path())}>
          <ExternalLink />
          Open preview
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
