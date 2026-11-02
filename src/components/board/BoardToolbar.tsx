import { Link } from '@tanstack/react-router'
import {
  ChevronLeft,
  PanelRight,
  RotateCcw,
  Smartphone,
  Snail,
  TriangleAlert,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { Kbd } from '@/components/ui/kbd'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { slowMotionFactor, useEditor } from '@/lib/editor'
import { cn } from '@/lib/utils'
import { useWorkspace } from '@/lib/workspace/store'
import { useCanvasUi } from './canvas-ui'

export function CanvasToolbar({
  project,
  projectName,
  canvasName,
}: {
  project: string
  projectName: string
  canvasName: string
}) {
  const slowMotion = useEditor((s) => s.slowMotion)
  const toggleSlowMotion = useEditor((s) => s.toggleSlowMotion)
  const replayAll = useEditor((s) => s.replayAll)
  const openPhone = useEditor((s) => s.setPhoneDialogOpen)
  const inspectorOpen = useCanvasUi((s) => s.inspectorOpen)
  const toggleInspector = useCanvasUi((s) => s.toggleInspector)
  const save = useWorkspace((s) => s.save)

  return (
    <>
      <div className="pointer-events-none absolute inset-x-4 top-4 z-10 flex items-start justify-between">
        <nav className="pointer-events-auto flex items-center gap-1 rounded-xl border bg-background/90 py-1 pl-1 pr-3 text-[14px] shadow-sm backdrop-blur">
          <Link
            to="/p/$project"
            params={{ project }}
            className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label={`Back to ${projectName}`}
          >
            <ChevronLeft className="size-4" />
          </Link>
          <Link
            to="/p/$project"
            params={{ project }}
            className="text-muted-foreground hover:text-foreground"
          >
            {projectName}
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="font-medium">{canvasName}</span>
        </nav>

        <div className="pointer-events-auto flex items-center gap-0.5 rounded-xl border bg-background/90 p-1 shadow-sm backdrop-blur">
          <ToolButton label="Replay all" shortcut="R" onClick={replayAll}>
            <RotateCcw />
          </ToolButton>
          <ToolButton
            label={`Slow motion (${slowMotionFactor}× slower)`}
            shortcut="S"
            onClick={toggleSlowMotion}
            active={slowMotion}
          >
            <Snail />
          </ToolButton>
          <ToolButton label="Open on phone" onClick={() => openPhone(true)}>
            <Smartphone />
          </ToolButton>
          <ToolButton
            label="Inspector"
            shortcut="I"
            onClick={toggleInspector}
            active={inspectorOpen}
          >
            <PanelRight />
          </ToolButton>
        </div>
      </div>

      {save.status === 'error' && (
        <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-lg border border-destructive/40 bg-background px-3 py-2 text-sm text-destructive shadow-sm">
          <TriangleAlert className="size-4" />
          Couldn't save frame positions: {save.message}
        </div>
      )}
    </>
  )
}

function ToolButton({
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
            'grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground [&_svg]:size-4',
            active && 'bg-brand-soft text-brand hover:bg-brand-soft hover:text-brand',
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
