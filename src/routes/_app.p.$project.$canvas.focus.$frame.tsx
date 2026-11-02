import { createFileRoute, Link, notFound, useNavigate } from '@tanstack/react-router'
import { ChevronLeft, Maximize, Minimize, RotateCcw, Snail } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import { VariantSwitcher } from '@/components/canvas/VariantSwitcher'
import { Kbd } from '@/components/ui/kbd'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { getDevice } from '@/lib/devices'
import { frameKey, useEditor, useTimeScale } from '@/lib/editor'
import { type FromPreview, isMessage, type ToPreview } from '@/lib/preview-messages'
import { cn } from '@/lib/utils'
import { frameLabel, frameVariants } from '@/lib/variants'
import { useLoadedScreen } from '@/lib/workspace/screens'
import { findCanvas, useCanvasEntry, useWorkspace } from '@/lib/workspace/store'

/**
 * Focused preview (concept 05): one phone, centred, at true proportions. The
 * screen runs in an iframe at exact device size for real viewport isolation.
 */
export const Route = createFileRoute('/_app/p/$project/$canvas/focus/$frame')({
  validateSearch: (search: Record<string, unknown>): { v?: string } => ({
    v: typeof search.v === 'string' ? search.v : undefined,
  }),
  beforeLoad: ({ params }) => {
    const entry = findCanvas(
      useWorkspace.getState().projects,
      params.project,
      params.canvas,
    )
    if (!entry?.canvas?.frames.some((f) => f.id === params.frame)) throw notFound()
  },
  component: FocusPage,
})

function FocusPage() {
  const params = Route.useParams()
  const { v } = Route.useSearch()
  const navigate = useNavigate()
  const entry = useCanvasEntry(params.project, params.canvas)
  const canvas = entry?.canvas
  const iframe = useRef<HTMLIFrameElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const [current, setCurrent] = useState(params.frame)
  const [ready, setReady] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [scale, setScale] = useState(1)

  const allVariants = useEditor((s) => s.variants)
  const setVariant = useEditor((s) => s.setVariant)
  const replayTick = useEditor((s) => s.replayTick)
  const slowMotion = useEditor((s) => s.slowMotion)
  const toggleSlowMotion = useEditor((s) => s.toggleSlowMotion)
  const replayAll = useEditor((s) => s.replayAll)
  const timeScale = useTimeScale()

  // A ?v= in the URL wins over the remembered choice for the starting frame.
  // biome-ignore lint/correctness/useExhaustiveDependencies: apply once per URL
  useEffect(() => {
    if (v) setVariant(frameKey(params.project, params.canvas, params.frame), v)
  }, [v, params.project, params.canvas, params.frame])

  const variants = useMemo(() => {
    const prefix = `${params.project}/${params.canvas}/`
    return Object.fromEntries(
      Object.entries(allVariants)
        .filter(([key]) => key.startsWith(prefix))
        .map(([key, id]) => [key.slice(prefix.length), id]),
    )
  }, [allVariants, params.project, params.canvas])

  const send = useCallback((message: ToPreview) => {
    iframe.current?.contentWindow?.postMessage(message, window.location.origin)
  }, [])

  useEffect(() => {
    if (ready) send({ type: 'springboard:state', variants, timeScale })
  }, [ready, send, variants, timeScale])

  const firstTick = useRef(replayTick)
  useEffect(() => {
    if (replayTick !== firstTick.current) send({ type: 'springboard:replay' })
  }, [replayTick, send])

  const frame = canvas?.frames.find((f) => f.id === current) ?? canvas?.frames[0]
  const device = getDevice(frame?.device ?? canvas?.device)
  const loaded = useLoadedScreen(params.project, params.canvas, frame?.screen ?? '')
  const options = useMemo(
    () => (frame ? frameVariants(frame, loaded?.ok ? loaded.screen : null) : []),
    [frame, loaded],
  )

  // Fit the phone into the space available, never upscaling past 1:1.
  useEffect(() => {
    const el = stage.current
    if (!el) return
    const observer = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect
      // Leave room for the label row above and the shortcut hint below.
      setScale(Math.min(1, (height - 120) / device.height, (width - 48) / device.width))
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [device.height, device.width])

  useEffect(() => {
    const onChange = () => setFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  const backToCanvas = useCallback(
    () =>
      navigate({
        to: '/p/$project/$canvas',
        params: { project: params.project, canvas: params.canvas },
      }),
    [navigate, params.project, params.canvas],
  )

  const step = useCallback(
    (delta: number) => {
      if (!canvas) return
      const index = canvas.frames.findIndex((f) => f.id === params.frame)
      const next =
        canvas.frames[(index + delta + canvas.frames.length) % canvas.frames.length]
      void navigate({
        to: '/p/$project/$canvas/focus/$frame',
        params: { ...params, frame: next.id },
        search: {},
        replace: true,
      })
    },
    [canvas, navigate, params],
  )

  const chooseVariant = useCallback(
    (index: number) => {
      const option = options[index]
      if (option && frame)
        setVariant(frameKey(params.project, params.canvas, frame.id), option.id)
    },
    [options, frame, params.project, params.canvas, setVariant],
  )

  useEffect(() => {
    setCurrent(params.frame)
    setReady(false)
  }, [params.frame])

  // Messages from the iframe: readiness, flow position, forwarded shortcuts.
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const message = isMessage<FromPreview>(event)
      if (!message) return
      if (message.type === 'springboard:ready') setReady(true)
      if (message.type === 'springboard:frame') setCurrent(message.frameId)
      if (message.type === 'springboard:key') {
        const { key } = message
        if (key === 'r') replayAll()
        else if (key === 's') toggleSlowMotion()
        else if (key === 'escape') void backToCanvas()
        else if (key === 'arrowleft') step(-1)
        else if (key === 'arrowright') step(1)
        else if (/^[1-9]$/.test(key)) chooseVariant(Number(key) - 1)
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [replayAll, toggleSlowMotion, backToCanvas, step, chooseVariant])

  useHotkeys('escape', () => void backToCanvas(), { enabled: !fullscreen }, [
    backToCanvas,
    fullscreen,
  ])
  useHotkeys('arrowleft', () => step(-1), [step])
  useHotkeys('arrowright', () => step(1), [step])
  useHotkeys('1,2,3,4,5,6,7,8,9', (e) => chooseVariant(Number(e.key) - 1), [
    chooseVariant,
  ])

  // Variants, slow motion and replays reach the iframe by postMessage once it
  // reports ready, so its URL only changes when the starting frame does.
  const src = `/embed/${params.project}/${params.canvas}/${params.frame}`

  if (!canvas || !frame) return null
  const variantId = variants[frame.id] ?? 'default'

  return (
    <div className="flex h-full flex-col bg-canvas">
      <header className="flex items-center justify-between px-4 py-3">
        <Link
          to="/p/$project/$canvas"
          params={{ project: params.project, canvas: params.canvas }}
          className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          {canvas.name}
        </Link>
        <div className="flex items-center gap-0.5">
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
        </div>
      </header>

      <div ref={stage} className="flex min-h-0 flex-1 items-center justify-center">
        <div style={{ width: device.width * scale }}>
          <div className="mb-2 flex items-center justify-between px-1">
            <span className="text-[15px] font-medium text-frame-label">
              {frameLabel(frame)}
            </span>
            <VariantSwitcher
              options={options}
              value={variantId}
              align="end"
              onChange={(id) =>
                setVariant(frameKey(params.project, params.canvas, frame.id), id)
              }
            />
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
              key={src}
              ref={iframe}
              src={src}
              title={`${frameLabel(frame)} preview`}
              className="block origin-top-left border-0"
              style={{
                width: device.width,
                height: device.height,
                transform: `scale(${scale})`,
              }}
            />
          </div>
          <p className="mt-3 text-center text-[13px] text-muted-foreground">
            <Kbd>←</Kbd> <Kbd>→</Kbd> screens · <Kbd>1</Kbd>–<Kbd>9</Kbd> variants ·{' '}
            <Kbd>Esc</Kbd> canvas
          </p>
        </div>
      </div>
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
  children: React.ReactNode
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
