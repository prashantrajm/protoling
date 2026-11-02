import { useLocation } from '@tanstack/react-router'
import { Check, Copy, Hand, Keyboard, TriangleAlert } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { encode } from 'uqr'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Kbd } from '@/components/ui/kbd'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useEditor } from '@/lib/editor'
import { getHostRouter } from '@/lib/router-registry'
import { projectScreens } from '@/lib/screens'
import { useWorkspace } from '@/lib/workspace/store'

/**
 * "Open on phone". Explains the hidden three-finger gesture before the phone
 * preview opens (the preview itself shows no controls), and gives a QR code
 * for the dev server's LAN address.
 */
export function PhoneDialog() {
  const open = useEditor((s) => s.phoneDialogOpen)
  const setOpen = useEditor((s) => s.setPhoneDialogOpen)
  const projects = useWorkspace((s) => s.projects)
  const meta = useWorkspace((s) => s.meta)
  const refreshMeta = useWorkspace((s) => s.refreshMeta)
  const location = useLocation()

  // Everything that can be opened: each app's start, then its screens.
  const targets = useMemo(
    () =>
      projects
        .filter((p) => p.hasApp)
        .flatMap((p) => {
          const group = p.project?.name ?? p.slug
          return [
            { value: `/${p.slug}`, group, label: 'App start' },
            ...projectScreens(getHostRouter(), p.slug)
              .filter((s) => s.url)
              .map((s) => ({ value: s.url as string, group, label: s.name })),
          ]
        }),
    [projects],
  )

  // In play mode, offer exactly what's on screen, variants included.
  const fromRoute = useMemo(() => {
    const play = location.pathname.match(/^\/p\/([^/]+)\/play\/?(.*)$/)
    if (play) return `/${play[1]}${play[2] ? `/${play[2]}` : ''}${location.searchStr}`
    const project = location.pathname.match(/^\/p\/([^/]+)/)?.[1]
    return project ? `/${project}` : undefined
  }, [location.pathname, location.searchStr])

  const [target, setTarget] = useState<string | undefined>()
  useEffect(() => {
    if (open) {
      setTarget(fromRoute ?? targets[0]?.value)
      void refreshMeta()
    }
  }, [open, fromRoute, targets, refreshMeta])

  const base = (meta?.network.urls[0] ?? `${window.location.origin}/`).replace(/\/$/, '')
  const url = `${base}${target ?? ''}`
  const exposed = meta?.network.exposed ?? false
  const options =
    target && !targets.some((t) => t.value === target)
      ? [
          { value: target, group: 'Current', label: 'What you’re playing now' },
          ...targets,
        ]
      : targets

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="grid-cols-[minmax(0,1fr)] sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Open on phone</DialogTitle>
          <DialogDescription>
            Scan with your phone's camera. It has to be on the same Wi-Fi as this
            computer.
          </DialogDescription>
        </DialogHeader>

        {options.length > 0 && (
          <Select value={target} onValueChange={setTarget}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose a screen" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(Object.groupBy(targets, (t) => t.group)).map(
                ([group, items]) => (
                  <SelectGroup key={group}>
                    <SelectLabel>{group}</SelectLabel>
                    {items?.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ),
              )}
            </SelectContent>
          </Select>
        )}

        {!exposed && (
          <div className="flex gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-600" />
            <p>
              The dev server only accepts connections from this computer. Stop it and run{' '}
              <code className="rounded bg-background px-1 py-0.5">bun run dev:phone</code>{' '}
              to make it reachable from your phone.
            </p>
          </div>
        )}

        <div className="flex gap-5">
          <QrCode value={url} className="size-40 shrink-0 rounded-lg bg-white p-2.5" />
          <div className="min-w-0 space-y-3 text-sm">
            <p className="flex gap-2">
              <Hand className="mt-0.5 size-4 shrink-0 text-brand" />
              <span>
                The preview fills the screen with no controls.{' '}
                <strong>Tap with three fingers</strong> to show the menu for variants and
                exit, and again to hide it.
              </span>
            </p>
            <p className="flex gap-2">
              <Keyboard className="mt-0.5 size-4 shrink-0 text-brand" />
              <span>
                With a keyboard: <Kbd>⌘</Kbd> <Kbd>.</Kbd> toggles the menu,{' '}
                <Kbd>Esc</Kbd> closes it, then exits.
              </span>
            </p>
            <CopyUrl url={url} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function QrCode({ value, className }: { value: string; className?: string }) {
  const { data, size } = useMemo(() => encode(value, { border: 0 }), [value])
  const path = useMemo(() => {
    let d = ''
    data.forEach((row, y) => {
      row.forEach((on, x) => {
        if (on) d += `M${x},${y}h1v1h-1z`
      })
    })
    return d
  }, [data])
  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      role="img"
      aria-label={`QR code for ${value}`}
    >
      <path d={path} fill="#000" shapeRendering="crispEdges" />
    </svg>
  )
}

function CopyUrl({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      }}
      className="flex w-full items-center gap-2 rounded-md bg-muted px-2.5 py-1.5 text-left font-mono text-[12px] text-muted-foreground hover:text-foreground"
    >
      <span className="truncate">{url}</span>
      {copied ? (
        <Check className="size-3.5 shrink-0" />
      ) : (
        <Copy className="size-3.5 shrink-0" />
      )}
    </button>
  )
}
