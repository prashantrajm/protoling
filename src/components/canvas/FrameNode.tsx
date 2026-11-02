import { Link } from '@tanstack/react-router'
import { Handle, type Node, type NodeProps, Position } from '@xyflow/react'
import { Maximize2, RotateCcw } from 'lucide-react'
import { memo, useMemo } from 'react'
import { ScreenHost } from '@/components/screen/ScreenHost'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { getDevice } from '@/lib/devices'
import { frameKey, useEditor, useTimeScale } from '@/lib/editor'
import type { Canvas, Frame } from '@/lib/schema'
import { cn } from '@/lib/utils'
import { frameLabel, frameVariants } from '@/lib/variants'
import { useLoadedScreen } from '@/lib/workspace/screens'
import type { FlowControls } from '@/runtime/context'
import { useCanvasUi } from './canvas-ui'
import { VariantSwitcher } from './VariantSwitcher'

export type FrameNodeData = {
  frame: Frame
  canvas: Canvas
  project: string
  canvasSlug: string
  flow: (frameId: string) => FlowControls
}

export type FrameNodeType = Node<FrameNodeData, 'frame'>

/**
 * A frame on the canvas: label row (drag handle), live screen, size caption.
 * The screen is `nodrag nopan`, so clicks and drags inside it reach the
 * prototype instead of moving the canvas. A selected frame also takes the
 * scroll wheel, so scrollable screens can scroll.
 */
export const FrameNode = memo(function FrameNode({
  data,
  selected,
}: NodeProps<FrameNodeType>) {
  const { frame, canvas, project, canvasSlug } = data
  const device = getDevice(frame.device ?? canvas.device)
  const key = frameKey(project, canvasSlug, frame.id)
  const variantId = useEditor((s) => s.variants[key])
  const setVariant = useEditor((s) => s.setVariant)
  const replayTick = useEditor((s) => s.replayTick)
  const timeScale = useTimeScale()
  const replay = useCanvasUi((s) => s.replay[frame.id] ?? 0)
  const params = useCanvasUi((s) => s.params[frame.id])
  const selectFrame = useCanvasUi((s) => s.selectFrame)
  const replayFrame = useCanvasUi((s) => s.replayFrame)
  const loaded = useLoadedScreen(project, canvasSlug, frame.screen)
  const options = useMemo(
    () => frameVariants(frame, loaded?.ok ? loaded.screen : null),
    [frame, loaded],
  )
  const baseFlow = data.flow(frame.id)
  const flow = useMemo(() => ({ ...baseFlow, params: params ?? {} }), [baseFlow, params])

  return (
    <div className="group" style={{ width: device.width }}>
      <div
        className="sb-drag flex h-10 cursor-grab items-center gap-1.5 active:cursor-grabbing"
        onPointerDown={() => selectFrame(frame.id)}
      >
        <span className="truncate text-[17px] font-medium text-frame-label">
          {frameLabel(frame)}
        </span>
        <VariantSwitcher
          options={options}
          value={variantId ?? 'default'}
          onChange={(id) => {
            setVariant(key, id)
            replayFrame(frame.id)
          }}
        />
        <div
          className={cn(
            'nodrag ml-auto flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100',
            selected && 'opacity-100',
          )}
        >
          <IconButton label="Replay" onClick={() => replayFrame(frame.id)}>
            <RotateCcw className="size-4" />
          </IconButton>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                to="/p/$project/$canvas/focus/$frame"
                params={{ project, canvas: canvasSlug, frame: frame.id }}
                search={{
                  v: variantId && variantId !== 'default' ? variantId : undefined,
                }}
                className="grid size-8 place-items-center rounded-md text-frame-label transition-colors hover:bg-foreground/5 hover:text-foreground"
                aria-label="Focus"
              >
                <Maximize2 className="size-4" />
              </Link>
            </TooltipTrigger>
            <TooltipContent>Focus (F)</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <div
        className={cn('nodrag nopan relative transition-shadow', selected && 'nowheel')}
        style={{
          borderRadius: device.radius,
          boxShadow: selected
            ? '0 0 0 3px var(--brand)'
            : '0 0 0 1px var(--frame-border), 0 1px 3px rgba(0,0,0,0.06)',
        }}
        onPointerDownCapture={() => selectFrame(frame.id)}
      >
        <ScreenHost
          project={project}
          canvas={canvasSlug}
          frame={frame}
          device={device}
          mode="canvas"
          variantId={variantId}
          replayKey={replay + replayTick}
          timeScale={timeScale}
          flow={flow}
        />
      </div>

      <p className="mt-3 text-center text-[14px] tabular-nums text-frame-label">
        {device.width} × {device.height}
      </p>

      <Handle
        type="target"
        position={Position.Left}
        isConnectable={false}
        className="sb-handle"
      />
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={false}
        className="sb-handle"
      />
    </div>
  )
})

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
          className="grid size-8 place-items-center rounded-md text-frame-label transition-colors hover:bg-foreground/5 hover:text-foreground"
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}
