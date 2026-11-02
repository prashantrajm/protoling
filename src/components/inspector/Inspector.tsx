import { Check, Copy } from 'lucide-react'
import { useMemo, useState } from 'react'
import { CodeBlock } from '@/components/handoff/CodeBlock'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { ScreenSnapshot } from '@/lib/bridge'
import { generateHandoff, handoffTargets, tokenValues } from '@/lib/motion/handoff'
import { describeToken } from '@/lib/motion/tokens'
import type { MotionTokens } from '@/lib/schema'
import { cn } from '@/lib/utils'
import { MotionCurve } from './MotionCurve'

/**
 * Read-only: everything shown comes from the route's code. Springboard is
 * code-first, so the inspector explains and exports motion rather than
 * editing it.
 */
export function Inspector({
  screen,
  file,
  onVariant,
  empty,
  className,
}: {
  screen: ScreenSnapshot | null
  file: string | null
  onVariant: (id: string) => void
  /** Shown when there's no screen to inspect. */
  empty?: React.ReactNode
  className?: string
}) {
  return (
    <aside
      className={cn(
        'flex w-[360px] shrink-0 flex-col overflow-y-auto border-l bg-background',
        className,
      )}
    >
      {screen ? (
        <ScreenDetails screen={screen} file={file} onVariant={onVariant} />
      ) : (
        <div className="px-5 py-4 text-sm text-muted-foreground">
          {empty ?? (
            <p>
              The screen on top has no <code>staticData.screen</code>, so there's nothing
              to inspect.
            </p>
          )}
        </div>
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

function ScreenDetails({
  screen,
  file,
  onVariant,
}: {
  screen: ScreenSnapshot
  file: string | null
  onVariant: (id: string) => void
}) {
  const variant =
    screen.variants.find((v) => v.id === screen.variantId) ?? screen.variants[0]
  // Handoff covers the screen's own tokens plus how it's presented.
  const handoffTokens = useMemo<MotionTokens>(
    () =>
      screen.transition
        ? { ...screen.tokens, present: screen.transition }
        : screen.tokens,
    [screen.tokens, screen.transition],
  )

  return (
    <>
      <div className="border-b px-5 py-4">
        <h2 className="text-[17px] font-semibold">{screen.name}</h2>
        <p className="mt-0.5 font-mono text-[12px] text-muted-foreground">{screen.key}</p>
        {file && <FilePath path={file} />}
      </div>

      {screen.variants.length > 1 && (
        <Section title="Variant">
          <ul className="space-y-0.5" aria-label="Variant">
            {screen.variants.map((option) => (
              <li key={option.id}>
                <button
                  type="button"
                  aria-pressed={option.id === variant.id}
                  onClick={() => onVariant(option.id)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted',
                    option.id === variant.id && 'bg-brand-soft',
                  )}
                >
                  <span className="w-5 tabular-nums text-muted-foreground">
                    {String(option.index + 1).padStart(2, '0')}
                  </span>
                  <span className="flex-1">{option.name}</span>
                  {option.id === variant.id && <Check className="size-4 text-brand" />}
                </button>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {screen.transition && (
        <Section title={`Presented as ${screen.presentation ?? 'push'}`}>
          <TokenList tokens={{ present: screen.transition }} />
        </Section>
      )}

      <Section title={`Motion · ${Object.keys(screen.tokens).length}`}>
        {Object.keys(screen.tokens).length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No motion tokens. Add them to <code>staticData.screen.motion</code> and read
            them with <code>useMotion()</code>.
          </p>
        ) : (
          <TokenList tokens={screen.tokens} />
        )}
      </Section>

      {Object.keys(handoffTokens).length > 0 && (
        <Section title="Handoff" className="border-b-0">
          <Handoff
            tokens={handoffTokens}
            name={screen.name}
            variant={variant.id === 'default' ? undefined : variant.name}
          />
        </Section>
      )}
    </>
  )
}

function TokenList({ tokens }: { tokens: MotionTokens }) {
  return (
    <ul className="space-y-5">
      {Object.entries(tokens).map(([key, token]) => (
        <li key={key}>
          <code className="text-[13px] font-medium">{key}</code>
          <p className="mb-2 mt-1 text-[12px] text-muted-foreground">
            {describeToken(token)}
          </p>
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
