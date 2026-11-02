import {
  BaseEdge,
  type Edge,
  EdgeLabelRenderer,
  type EdgeProps,
  getBezierPath,
} from '@xyflow/react'
import { memo } from 'react'
import type { Connector } from '@/lib/schema'
import { cn } from '@/lib/utils'
import { useCanvasUi } from './canvas-ui'

export type ConnectorEdgeType = Edge<{ connector: Connector }, 'connector'>

const animationLabel: Record<Connector['animation'], string> = {
  push: 'Push',
  modal: 'Modal',
  fade: 'Fade',
  none: 'Instant',
}

/** Bézier from the right edge of one frame to the left edge of the next. */
export const ConnectorEdge = memo(function ConnectorEdge(
  props: EdgeProps<ConnectorEdgeType>,
) {
  const connector = props.data?.connector
  const highlighted = useCanvasUi((s) => s.highlighted === props.id)
  const selectConnector = useCanvasUi((s) => s.selectConnector)
  const [path, labelX, labelY] = getBezierPath(props)
  const active = props.selected || highlighted

  return (
    <>
      <BaseEdge
        id={props.id}
        path={path}
        interactionWidth={24}
        className={cn(highlighted && 'sb-edge-flow')}
        style={{
          stroke: active ? 'var(--brand)' : 'var(--frame-border)',
          strokeWidth: active ? 2 : 1.5,
          transition: 'stroke 200ms',
        }}
      />
      {connector && (
        <EdgeLabelRenderer>
          <button
            type="button"
            onClick={() => selectConnector(props.id)}
            className={cn(
              'nodrag nopan pointer-events-auto absolute flex items-center gap-1.5 rounded-full border bg-background px-2.5 py-1 text-[12px] shadow-sm transition-colors',
              active
                ? 'border-brand text-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            }}
          >
            {connector.label && <span className="font-medium">{connector.label}</span>}
            <span className="text-muted-foreground">
              {animationLabel[connector.animation]}
            </span>
          </button>
        </EdgeLabelRenderer>
      )}
    </>
  )
})
