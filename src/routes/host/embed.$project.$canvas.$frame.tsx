import { createFileRoute } from '@tanstack/react-router'
import { useCallback, useEffect, useState } from 'react'
import { FlowPlayer } from '@/components/screen/FlowPlayer'
import { type FromPreview, isMessage, type ToPreview } from '@/lib/preview-messages'
import { useCanvasEntry } from '@/lib/workspace/store'

/**
 * A bare flow player, loaded by the focus page in an iframe at exact device
 * size. Inside the iframe the screen gets the real viewport: 100vh, fixed
 * positioning and scrolling behave as on a phone.
 */
export const Route = createFileRoute('/embed/$project/$canvas/$frame')({
  validateSearch: (search: Record<string, unknown>): { v?: string } => ({
    v: typeof search.v === 'string' ? search.v : undefined,
  }),
  component: Embed,
})

const forwardedKeys = new Set([
  'r',
  's',
  'f',
  'escape',
  'arrowleft',
  'arrowright',
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

function post(message: FromPreview) {
  window.parent.postMessage(message, window.location.origin)
}

function Embed() {
  const params = Route.useParams()
  const { v } = Route.useSearch()
  const entry = useCanvasEntry(params.project, params.canvas)
  const [variants, setVariants] = useState<Record<string, string>>(
    v ? { [params.frame]: v } : {},
  )
  const [timeScale, setTimeScale] = useState(1)
  const [replayKey, setReplayKey] = useState(0)

  useEffect(() => {
    document.documentElement.classList.add('sb-embed')
    const onMessage = (event: MessageEvent) => {
      const message = isMessage<ToPreview>(event)
      if (!message) return
      if (message.type === 'springboard:state') {
        setVariants(message.variants)
        setTimeScale(message.timeScale)
      } else if (message.type === 'springboard:replay') {
        setReplayKey((k) => k + 1)
      }
    }
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      if (target.closest('input, textarea, select, [contenteditable]')) return
      if (event.metaKey || event.ctrlKey || event.altKey) return
      const key = event.key.toLowerCase()
      if (forwardedKeys.has(key))
        post({ type: 'springboard:key', key, shiftKey: event.shiftKey })
    }
    window.addEventListener('message', onMessage)
    window.addEventListener('keydown', onKey)
    post({ type: 'springboard:ready' })
    return () => {
      window.removeEventListener('message', onMessage)
      window.removeEventListener('keydown', onKey)
    }
  }, [])

  const onFrameChange = useCallback(
    (frameId: string) => post({ type: 'springboard:frame', frameId }),
    [],
  )

  if (!entry?.canvas) return null
  return (
    <div className="h-dvh w-screen">
      <FlowPlayer
        project={params.project}
        canvasSlug={params.canvas}
        canvas={entry.canvas}
        startFrame={params.frame}
        variants={variants}
        mode="focus"
        timeScale={timeScale}
        replayKey={replayKey}
        onFrameChange={onFrameChange}
      />
    </div>
  )
}
