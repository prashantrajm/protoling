import { Link, useParams } from '@tanstack/react-router'
import {
  Folder,
  FolderOpen,
  LayoutGrid,
  Monitor,
  Moon,
  Play,
  Smartphone,
  Sun,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { projectBoards } from '@/lib/boards'
import { type Theme, useEditor } from '@/lib/editor'
import { cn } from '@/lib/utils'
import { useWorkspace } from '@/lib/workspace/store'

export function AppSidebar() {
  const projects = useWorkspace((s) => s.projects)
  const params = useParams({ strict: false }) as { project?: string }

  return (
    <aside className="flex w-[264px] shrink-0 flex-col border-r bg-sidebar">
      <Link to="/" className="px-7 pb-6 pt-7 text-[22px] font-semibold tracking-tight">
        Springboard
      </Link>

      <div className="px-7 pb-2">
        <span className="text-[13px] font-medium text-muted-foreground">Projects</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 pb-4">
        {projects.length === 0 && (
          <p className="px-3 py-2 text-sm text-muted-foreground">
            No projects yet. Add one under <code>projects/</code>.
          </p>
        )}
        <ul className="space-y-0.5">
          {projects.map((project) => {
            const open = project.slug === params.project
            const Icon = open ? FolderOpen : Folder
            return (
              <li key={project.slug}>
                <Link
                  to="/p/$project"
                  params={{ project: project.slug }}
                  activeOptions={{ exact: true }}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-[15px] transition-colors hover:bg-sidebar-accent',
                    open && 'font-medium',
                  )}
                  activeProps={{ className: 'bg-brand-soft' }}
                >
                  <Icon className="size-[18px] text-muted-foreground" />
                  <span className="truncate">
                    {project.project?.name ?? project.slug}
                  </span>
                </Link>
                {open && project.hasApp && (
                  <ul className="mt-0.5 space-y-0.5 pb-1">
                    <li>
                      <Link
                        to="/p/$project/play/$"
                        params={{ project: project.slug, _splat: '' }}
                        className={subLink}
                        activeProps={{ className: subLinkActive }}
                      >
                        <Play className="size-4 shrink-0" />
                        <span className="truncate">Play</span>
                      </Link>
                    </li>
                    {projectBoards(project).map((board) => (
                      <li key={board.slug}>
                        <Link
                          to="/p/$project/boards/$board"
                          params={{ project: project.slug, board: board.slug }}
                          className={subLink}
                          activeProps={{ className: subLinkActive }}
                        >
                          <LayoutGrid className="size-4 shrink-0" />
                          <span className="truncate">{board.name}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            )
          })}
        </ul>
      </nav>

      <SidebarFooter />
    </aside>
  )
}

const subLink =
  'flex items-center gap-3 rounded-lg py-1.5 pl-9 pr-3 text-[14px] text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground'
const subLinkActive = 'bg-brand-soft text-foreground'

const themes: { id: Theme; label: string; icon: typeof Sun }[] = [
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'dark', label: 'Dark', icon: Moon },
  { id: 'system', label: 'System', icon: Monitor },
]

function SidebarFooter() {
  const theme = useEditor((s) => s.theme)
  const setTheme = useEditor((s) => s.setTheme)
  const openPhone = useEditor((s) => s.setPhoneDialogOpen)

  return (
    <div className="flex items-center justify-between border-t px-5 py-4">
      <div
        className="flex rounded-lg bg-muted p-0.5"
        role="radiogroup"
        aria-label="Theme"
      >
        {themes.map(({ id, label, icon: Icon }) => (
          <Tooltip key={id}>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-pressed={theme === id}
                aria-label={label}
                onClick={() => setTheme(id)}
                className={cn(
                  'grid size-7 place-items-center rounded-md text-muted-foreground transition-colors',
                  theme === id && 'bg-background text-foreground shadow-sm',
                )}
              >
                <Icon className="size-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>{label}</TooltipContent>
          </Tooltip>
        ))}
      </div>
      <Button variant="ghost" size="sm" onClick={() => openPhone(true)}>
        <Smartphone />
        Open on phone
      </Button>
    </div>
  )
}
