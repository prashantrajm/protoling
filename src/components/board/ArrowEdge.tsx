import {
  BaseEdge,
  type Edge,
  EdgeLabelRenderer,
  type EdgeProps,
  getBezierPath,
} from '@xyflow/react'
import { memo } from 'react'
import { describeToken } from '@/lib/motion/tokens'
import type { Arrow } from '@/lib/screens'
import { cn } from '@/lib/utils'

export type ArrowEdgeType = Edge<{ arrow: Arrow }, 'arrow'>

const presentationLabel: Record<string, string> = {
  push: 'Push',
  sheet: 'Sheet',
  fullScreen: 'Full screen',
}

/** Parent → child screen, derived from the route tree. */
export const ArrowEdge = memo(function ArrowEdge(props: EdgeProps<ArrowEdgeType>) {
  const arrow = props.data?.arrow
  const [path, labelX, labelY] = getBezierPath(props)

  return (
    <>
      <BaseEdge
        id={props.id}
        path={path}
        style={{ stroke: 'var(--frame-border)', strokeWidth: 1.5 }}
      />
      {arrow && (
        <EdgeLabelRenderer>
          <div
            className={cn(
              'nodrag nopan absolute flex items-center gap-1.5 rounded-full border bg-background px-2.5 py-1 text-[12px] text-muted-foreground shadow-sm',
            )}
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            }}
            title={arrow.transition ? describeToken(arrow.transition) : undefined}
          >
            <span className="font-medium text-foreground">
              {presentationLabel[arrow.presentation] ?? arrow.presentation}
            </span>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
})
