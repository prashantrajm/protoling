import { useNavigate } from '@tanstack/react-router'
import {
  Folder,
  LayoutGrid,
  Monitor,
  Moon,
  Play,
  RotateCcw,
  Smartphone,
  Snail,
  Sun,
} from 'lucide-react'
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from '@/components/ui/command'
import { projectBoards } from '@/lib/boards'
import { useEditor } from '@/lib/editor'
import { getHostRouter } from '@/lib/router-registry'
import { projectScreens } from '@/lib/screens'
import { useWorkspace } from '@/lib/workspace/store'

/** ⌘K: jump to any project, board or screen, and run playback actions. */
export function CommandPalette() {
  const open = useEditor((s) => s.commandOpen)
  const setOpen = useEditor((s) => s.setCommandOpen)
  const projects = useWorkspace((s) => s.projects)
  const editor = useEditor()
  const navigate = useNavigate()

  function run(action: () => void) {
    setOpen(false)
    action()
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Command palette"
      description="Jump to a screen or run an action"
    >
      <Command>
        <CommandInput placeholder="Search projects, boards, screens…" />
        <CommandList>
          <CommandEmpty>Nothing found.</CommandEmpty>

          <CommandGroup heading="Playback">
            <CommandItem onSelect={() => run(editor.replayAll)}>
              <RotateCcw />
              Replay
              <CommandShortcut>R</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => run(editor.toggleSlowMotion)}>
              <Snail />
              {editor.slowMotion ? 'Turn off slow motion' : 'Slow motion'}
              <CommandShortcut>S</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => run(() => editor.setPhoneDialogOpen(true))}>
              <Smartphone />
              Open on phone
            </CommandItem>
          </CommandGroup>

          <CommandGroup heading="Theme">
            <CommandItem onSelect={() => run(() => editor.setTheme('light'))}>
              <Sun />
              Light
            </CommandItem>
            <CommandItem onSelect={() => run(() => editor.setTheme('dark'))}>
              <Moon />
              Dark
            </CommandItem>
            <CommandItem onSelect={() => run(() => editor.setTheme('system'))}>
              <Monitor />
              System
            </CommandItem>
          </CommandGroup>

          {projects.map((p) => {
            const name = p.project?.name ?? p.slug
            const screens = p.hasApp ? projectScreens(getHostRouter(), p.slug) : []
            return (
              <CommandGroup key={p.slug} heading={name}>
                <CommandItem
                  value={`project ${name}`}
                  onSelect={() =>
                    run(() =>
                      navigate({ to: '/p/$project', params: { project: p.slug } }),
                    )
                  }
                >
                  <Folder />
                  {name}
                </CommandItem>
                {p.hasApp && (
                  <CommandItem
                    value={`play ${name}`}
                    onSelect={() =>
                      run(() =>
                        navigate({
                          to: '/p/$project/play/$',
                          params: { project: p.slug, _splat: '' },
                        }),
                      )
                    }
                  >
                    <Play />
                    Play {name}
                  </CommandItem>
                )}
                {p.hasApp &&
                  projectBoards(p).map((b) => (
                    <CommandItem
                      key={b.slug}
                      value={`board ${name} ${b.name}`}
                      onSelect={() =>
                        run(() =>
                          navigate({
                            to: '/p/$project/boards/$board',
                            params: { project: p.slug, board: b.slug },
                          }),
                        )
                      }
                    >
                      <LayoutGrid />
                      {b.name}
                    </CommandItem>
                  ))}
                {screens
                  .filter((s) => s.url)
                  .map((s) => (
                    <CommandItem
                      key={s.routeId}
                      value={`screen ${name} ${s.name} ${s.key}`}
                      onSelect={() =>
                        run(() =>
                          navigate({
                            to: '/p/$project/play/$',
                            params: {
                              project: p.slug,
                              _splat: (s.url ?? '').replace(
                                new RegExp(`^/${p.slug}/?`),
                                '',
                              ),
                            },
                          }),
                        )
                      }
                      className="pl-8"
                    >
                      <Play />
                      {s.name}
                      <span className="font-mono text-[12px] text-muted-foreground">
                        {s.key}
                      </span>
                    </CommandItem>
                  ))}
              </CommandGroup>
            )
          })}
        </CommandList>
      </Command>
    </CommandDialog>
  )
}
