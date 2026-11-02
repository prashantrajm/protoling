import { useNavigate } from '@tanstack/react-router'
import {
  FileText,
  Folder,
  Maximize2,
  Monitor,
  Moon,
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
import { useEditor } from '@/lib/editor'
import { frameLabel } from '@/lib/variants'
import { useWorkspace } from '@/lib/workspace/store'

/** ⌘K: jump to any project, canvas or screen, and run playback actions. */
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
        <CommandInput placeholder="Search projects, canvases, screens…" />
        <CommandList>
          <CommandEmpty>Nothing found.</CommandEmpty>

          <CommandGroup heading="Playback">
            <CommandItem onSelect={() => run(editor.replayAll)}>
              <RotateCcw />
              Replay all
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

          {projects.map((p) => (
            <CommandGroup key={p.slug} heading={p.project?.name ?? p.slug}>
              <CommandItem
                value={`project ${p.project?.name ?? p.slug}`}
                onSelect={() =>
                  run(() => navigate({ to: '/p/$project', params: { project: p.slug } }))
                }
              >
                <Folder />
                {p.project?.name ?? p.slug}
              </CommandItem>
              {p.canvases.map((c) => (
                <div key={c.slug}>
                  <CommandItem
                    value={`canvas ${p.project?.name} ${c.canvas?.name ?? c.slug}`}
                    onSelect={() =>
                      run(() =>
                        navigate({
                          to: '/p/$project/$canvas',
                          params: { project: p.slug, canvas: c.slug },
                        }),
                      )
                    }
                  >
                    <FileText />
                    {c.canvas?.name ?? c.slug}
                  </CommandItem>
                  {c.canvas?.frames.map((f) => (
                    <CommandItem
                      key={f.id}
                      value={`screen ${p.project?.name} ${c.canvas?.name} ${frameLabel(f)}`}
                      onSelect={() =>
                        run(() =>
                          navigate({
                            to: '/p/$project/$canvas/focus/$frame',
                            params: { project: p.slug, canvas: c.slug, frame: f.id },
                            search: {},
                          }),
                        )
                      }
                      className="pl-8"
                    >
                      <Maximize2 />
                      {frameLabel(f)}
                      <span className="text-muted-foreground">{c.canvas?.name}</span>
                    </CommandItem>
                  ))}
                </div>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </Command>
    </CommandDialog>
  )
}
