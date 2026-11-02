import { Link } from '@tanstack/react-router'
import { ChevronLeft, PanelRight, RotateCcw, Smartphone, Snail } from 'lucide-react'
import type { ReactNode } from 'react'
import { Kbd } from '@/components/ui/kbd'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { slowMotionFactor, useEditor } from '@/lib/editor'
import { cn } from '@/lib/utils'
import { useBoardUi } from './board-ui'

export function BoardToolbar({
  project,
  projectName,
  boardName,
}: {
  project: string
  projectName: string
  boardName: string
}) {
  const slowMotion = useEditor((s) => s.slowMotion)
  const toggleSlowMotion = useEditor((s) => s.toggleSlowMotion)
  const replayAll = useEditor((s) => s.replayAll)
  const openPhone = useEditor((s) => s.setPhoneDialogOpen)
  const inspectorOpen = useBoardUi((s) => s.inspectorOpen)
  const toggleInspector = useBoardUi((s) => s.toggleInspector)

  return (
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
        <span className="font-medium">{boardName}</span>
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
