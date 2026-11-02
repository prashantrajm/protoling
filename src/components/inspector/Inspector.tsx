import { ArrowRight, Check, Copy } from 'lucide-react'
import { useMemo, useState } from 'react'
import { CodeBlock } from '@/components/handoff/CodeBlock'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getDevice } from '@/lib/devices'
import { frameKey, useEditor } from '@/lib/editor'
import { generateHandoff, handoffTargets, tokenValues } from '@/lib/motion/handoff'
import { describeToken } from '@/lib/motion/tokens'
import type { Canvas, Connector, Frame, MotionTokens } from '@/lib/schema'
import { cn } from '@/lib/utils'
import { frameLabel, frameVariants, padIndex, resolveTokens } from '@/lib/variants'
import { screenPath, useLoadedScreen } from '@/lib/workspace/screens'
import { useCanvasUi } from '../canvas/canvas-ui'
import { MotionCurve } from './MotionCurve'

/**
 * Read-only: everything here comes from code (screen files) and canvas.json.
 * Springboard is code-first, so the inspector explains and exports motion
 * rather than editing it.
 */
export function Inspector({
  project,
  slug,
  canvas,
}: {
  project: string
  slug: string
  canvas: Canvas
}) {
  const selectedFrame = useCanvasUi((s) => s.selectedFrame)
  const selectedConnector = useCanvasUi((s) => s.selectedConnector)
  const frame = canvas.frames.find((f) => f.id === selectedFrame)
  const connector = canvas.connectors.find((c) => c.id === selectedConnector)

  return (
    <aside className="flex w-[360px] shrink-0 flex-col overflow-y-auto border-l bg-background">
      {frame ? (
        <FrameInspector
          key={frame.id}
          project={project}
          slug={slug}
          canvas={canvas}
          frame={frame}
        />
      ) : connector ? (
        <ConnectorInspector canvas={canvas} connector={connector} />
      ) : (
        <CanvasOverview project={project} slug={slug} canvas={canvas} />
      )}
    </aside>
  )
}

function Section({
  title,
  children,
  className,
}: {
  title: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn('border-b px-5 py-4', className)}>
      <h3 className="mb-3 text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      {children}
    </section>
  )
}

function CanvasOverview({
  project,
  slug,
  canvas,
}: {
  project: string
  slug: string
  canvas: Canvas
}) {
  const device = getDevice(canvas.device)
  return (
    <>
      <div className="border-b px-5 py-4">
        <h2 className="text-[17px] font-semibold">{canvas.name}</h2>
        {canvas.description && (
          <p className="mt-1 text-sm text-muted-foreground">{canvas.description}</p>
        )}
        <FilePath path={`projects/${project}/canvases/${slug}/canvas.json`} />
      </div>
      <Section title="Canvas">
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
          <dt className="text-muted-foreground">Device</dt>
          <dd>
            {device.name} · {device.width} × {device.height}
          </dd>
          <dt className="text-muted-foreground">Screens</dt>
          <dd>{canvas.frames.length}</dd>
          <dt className="text-muted-foreground">Connectors</dt>
          <dd>{canvas.connectors.length}</dd>
        </dl>
      </Section>
      <p className="px-5 py-4 text-sm text-muted-foreground">
        Select a screen to see its motion values and handoff code, or a connector to see
        its transition.
      </p>
    </>
  )
}

function FrameInspector({
  project,
  slug,
  canvas,
  frame,
}: {
  project: string
  slug: string
  canvas: Canvas
  frame: Frame
}) {
  const loaded = useLoadedScreen(project, slug, frame.screen)
  const screen = loaded?.ok ? loaded.screen : null
  const key = frameKey(project, slug, frame.id)
  const variantId = useEditor((s) => s.variants[key]) ?? 'default'
  const setVariant = useEditor((s) => s.setVariant)
  const replayFrame = useCanvasUi((s) => s.replayFrame)
  const options = useMemo(() => frameVariants(frame, screen), [frame, screen])
  const variant = options.find((o) => o.id === variantId) ?? options[0]
  const tokens = useMemo(
    () => resolveTokens(screen?.motion ?? {}, variant),
    [screen, variant],
  )
  const device = getDevice(frame.device ?? canvas.device)

  return (
    <>
      <div className="border-b px-5 py-4">
        <h2 className="text-[17px] font-semibold">{frameLabel(frame)}</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {device.name} · {device.width} × {device.height}
        </p>
        <FilePath path={screenPath(project, slug, frame.screen).slice(1)} />
      </div>

      {loaded && !loaded.ok && (
        <p className="border-b bg-destructive/10 px-5 py-3 text-sm text-destructive">
          {loaded.error}
        </p>
      )}

      <Section title="Variant">
        <ul className="space-y-0.5" aria-label="Variant">
          {options.map((option) => (
            <li key={option.id}>
              <button
                type="button"
                aria-pressed={option.id === variant.id}
                onClick={() => {
                  setVariant(key, option.id)
                  replayFrame(frame.id)
                }}
                className={cn(
                  'flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted',
                  option.id === variant.id && 'bg-brand-soft',
                )}
              >
                <span className="w-5 tabular-nums text-muted-foreground">
                  {padIndex(option.index)}
                </span>
                <span className="flex-1">{option.name}</span>
                {option.source === 'canvas' && (
                  <span className="text-[11px] text-muted-foreground">canvas.json</span>
                )}
                {option.id === variant.id && <Check className="size-4 text-brand" />}
              </button>
            </li>
          ))}
        </ul>
      </Section>

      <Section title={`Motion · ${Object.keys(tokens).length}`}>
        {Object.keys(tokens).length === 0 ? (
          <p className="text-sm text-muted-foreground">
            This screen declares no motion tokens. Add them to{' '}
            <code>defineScreen({'{ motion }'})</code> and read them with{' '}
            <code>useMotion()</code>.
          </p>
        ) : (
          <TokenList tokens={tokens} overridden={Object.keys(variant.motion)} />
        )}
      </Section>

      {screen && Object.keys(tokens).length > 0 && (
        <Section title="Handoff" className="border-b-0">
          <Handoff
            tokens={tokens}
            name={screen.name}
            variant={variant.id === 'default' ? undefined : variant.name}
          />
        </Section>
      )}
    </>
  )
}

function ConnectorInspector({
  canvas,
  connector,
}: {
  canvas: Canvas
  connector: Connector
}) {
  const from = canvas.frames.find((f) => f.id === connector.from)
  const to = canvas.frames.find((f) => f.id === connector.to)
  const name = `${from?.screen ?? connector.from}To${to?.screen ?? connector.to}`
  const tokens: MotionTokens = { transition: connector.transition }

  return (
    <>
      <div className="border-b px-5 py-4">
        <h2 className="text-[17px] font-semibold">{connector.label ?? 'Connector'}</h2>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
          {from ? frameLabel(from) : connector.from}
          <ArrowRight className="size-3.5" />
          {to ? frameLabel(to) : connector.to}
        </p>
      </div>
      <Section title="Transition">
        <p className="mb-3 text-sm">
          <span className="text-muted-foreground">Animation:</span> {connector.animation}
        </p>
        <TokenList tokens={tokens} overridden={[]} />
      </Section>
      <Section title="Handoff" className="border-b-0">
        <Handoff tokens={tokens} name={name} />
      </Section>
    </>
  )
}

function TokenList({
  tokens,
  overridden,
}: {
  tokens: MotionTokens
  overridden: string[]
}) {
  return (
    <ul className="space-y-5">
      {Object.entries(tokens).map(([key, token]) => (
        <li key={key}>
          <div className="mb-1.5 flex items-baseline justify-between gap-2">
            <code className="text-[13px] font-medium">{key}</code>
            {overridden.includes(key) && (
              <span className="rounded bg-brand-soft px-1.5 py-0.5 text-[11px] text-brand">
                variant
              </span>
            )}
          </div>
          <p className="mb-2 text-[12px] text-muted-foreground">{describeToken(token)}</p>
          <MotionCurve token={token} />
          <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-0.5 text-[12px]">
            {tokenValues(token).map(({ label, value }) => (
              <div key={label} className="contents">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="text-right font-mono tabular-nums">{value}</dd>
              </div>
            ))}
          </dl>
        </li>
      ))}
    </ul>
  )
}

function Handoff({
  tokens,
  name,
  variant,
}: {
  tokens: MotionTokens
  name: string
  variant?: string
}) {
  return (
    <Tabs defaultValue="swiftui">
      <TabsList className="w-full">
        {handoffTargets.map((t) => (
          <TabsTrigger key={t.id} value={t.id} className="flex-1">
            {t.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {handoffTargets.map((t) => (
        <TabsContent key={t.id} value={t.id} className="mt-3">
          <CodeBlock
            code={generateHandoff(t.id, tokens, { name, variant })}
            lang={t.lang}
          />
        </TabsContent>
      ))}
    </Tabs>
  )
}

function FilePath({ path }: { path: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(path)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      }}
      className="mt-2 flex max-w-full items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-left font-mono text-[11px] text-muted-foreground hover:text-foreground"
      title="Copy path"
    >
      <span className="truncate">{path}</span>
      {copied ? (
        <Check className="size-3 shrink-0" />
      ) : (
        <Copy className="size-3 shrink-0" />
      )}
    </button>
  )
}
