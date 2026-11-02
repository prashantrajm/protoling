import { type AnyRouter, useNavigate, useRouterState } from '@tanstack/react-router'
import { Handle, type Node, type NodeProps, Position } from '@xyflow/react'
import { Play, RotateCcw } from 'lucide-react'
import { memo, useEffect, useState } from 'react'
import { MiniAppFrame } from '@/components/app/MiniAppFrame'
import { VariantSwitcher } from '@/components/preview/VariantSwitcher'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { ResolvedFrame } from '@/lib/boards'
import type { Device } from '@/lib/devices'
import { useEditor, useTimeScale } from '@/lib/editor'
import { topScreenSnapshot } from '@/lib/snapshot'
import { cn } from '@/lib/utils'
import { setVariantInUrl } from '@/runtime/screen'
import { useBoardUi } from './board-ui'

export type FrameNodeData = { frame: ResolvedFrame; project: string; device: Device }
export type FrameNodeType = Node<FrameNodeData, 'frame'>

/**
 * One app state on a board: label row, the live app, size caption. The app
 * is interactive (`nodrag nopan`); a selected frame also takes the scroll
 * wheel so scrollable screens scroll.
 */
export const FrameNode = memo(function FrameNode({ data }: NodeProps<FrameNodeType>) {
  const { frame, project, device } = data
  const selected = useBoardUi((s) => s.selected === frame.id)
  const [router, setRouter] = useState<AnyRouter | null>(null)
  const replay = useBoardUi((s) => s.replay[frame.id] ?? 0)
  const replayFrame = useBoardUi((s) => s.replayFrame)
  const select = useBoardUi((s) => s.select)
  const setFrameRouter = useBoardUi((s) => s.setRouter)
  const replayTick = useEditor((s) => s.replayTick)
  const timeScale = useTimeScale()
  const navigate = useNavigate()

  useEffect(() => setFrameRouter(frame.id, router), [frame.id, router, setFrameRouter])

  return (
    <div className="group" style={{ width: device.width }}>
      <div
        className="flex h-10 items-center gap-1.5"
        onPointerDown={() => select(frame.id)}
      >
        {router ? (
          <FrameLabel
            id={frame.id}
            fallback={frame.label}
            project={project}
            router={router}
          />
        ) : (
          <span className="truncate text-[17px] font-medium text-frame-label">
            {frame.label}
          </span>
        )}
        <div
          className={cn(
            'nodrag ml-auto flex items-center gap-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100',
            selected && 'opacity-100',
          )}
        >
          <IconButton label="Replay from the start" onClick={() => replayFrame(frame.id)}>
            <RotateCcw className="size-4" />
          </IconButton>
          <IconButton
            label="Play from here"
            onClick={() =>
              // Read the frame's location at click time: it may have navigated.
              void navigate({
                to: '/p/$project/play/$',
                params: { project, _splat: playPath(router, frame.url, project) },
                search: playSearch(router, frame.url) as never,
              })
            }
          >
            <Play className="size-4" />
          </IconButton>
        </div>
      </div>

      <div
        className={cn('nodrag nopan relative', selected && 'nowheel')}
        style={{
          borderRadius: device.radius,
          boxShadow: selected
            ? '0 0 0 3px var(--brand)'
            : '0 0 0 1px var(--frame-border), 0 1px 3px rgba(0,0,0,0.06)',
        }}
        onPointerDownCapture={() => select(frame.id)}
      >
        <MiniAppFrame
          key={replay}
          url={frame.url}
          device={device}
          timeScale={timeScale}
          replayKey={replayTick}
          onRouter={setRouter}
        />
      </div>

      <p className="mt-3 text-center text-[14px] tabular-nums text-frame-label">
        {device.width} × {device.height}
      </p>

      <Handle
        type="target"
        position={Position.Left}
        isConnectable={false}
        className="pl-handle"
      />
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={false}
        className="pl-handle"
      />
    </div>
  )
})

/** The frame's current screen and its variant switcher, following its router. */
function FrameLabel({
  id,
  fallback,
  project,
  router,
}: {
  id: string
  fallback: string
  project: string
  router: AnyRouter
}) {
  const matches = useRouterState({ router, select: (s) => s.matches })
  const setSnapshot = useBoardUi((s) => s.setSnapshot)
  const snapshot = topScreenSnapshot(matches, project)
  const snapshotKey = JSON.stringify(snapshot)

  // biome-ignore lint/correctness/useExhaustiveDependencies: keyed on value
  useEffect(() => setSnapshot(id, snapshot), [id, snapshotKey, setSnapshot])

  return (
    <>
      <span className="truncate text-[17px] font-medium text-frame-label">
        {snapshot && snapshot.name !== fallback.split(' · ')[0]
          ? snapshot.name
          : fallback}
      </span>
      {snapshot && (
        <VariantSwitcher
          options={snapshot.variants}
          value={snapshot.variantId}
          onChange={(variant) => setVariantInUrl(router, snapshot.key, variant)}
        />
      )}
    </>
  )
}

function current(router: AnyRouter | null, fallback: string): URL {
  return new URL(router?.state.location.href ?? fallback, 'http://x')
}

function playPath(router: AnyRouter | null, fallback: string, project: string): string {
  return current(router, fallback).pathname.replace(new RegExp(`^/${project}/?`), '')
}

function playSearch(router: AnyRouter | null, fallback: string): Record<string, string> {
  return Object.fromEntries(current(router, fallback).searchParams)
}

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          aria-label={label}
          className="grid size-8 place-items-center rounded-md text-frame-label hover:bg-foreground/5 hover:text-foreground"
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}
