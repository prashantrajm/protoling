import { canvasSchema, formatIssues, projectSchema } from '../schema'
import { type CanvasEntry, type ProjectEntry, useWorkspace } from './store'

/**
 * Discovers everything under projects/ with import.meta.glob, so adding a
 * file is all it takes to add a project, canvas or screen.
 *
 * This module accepts its own hot updates: when a JSON file or screen changes
 * it re-runs and pushes fresh data and loaders into the store instead of
 * reloading the page. It exports nothing on purpose: importers of a
 * self-accepting module would keep its stale bindings.
 */

const projectFiles = import.meta.glob<unknown>('/projects/*/project.json', {
  eager: true,
  import: 'default',
})
const canvasFiles = import.meta.glob<unknown>('/projects/*/canvases/*/canvas.json', {
  eager: true,
  import: 'default',
})
const screenFiles = import.meta.glob<{ default: unknown }>(
  '/projects/*/canvases/*/screens/*.tsx',
)

function parts(path: string): string[] {
  return path.replace(/^\/projects\//, '').split('/')
}

function build(): ProjectEntry[] {
  const projects = new Map<string, ProjectEntry>()

  for (const [path, raw] of Object.entries(projectFiles)) {
    const [slug] = parts(path)
    const parsed = projectSchema.safeParse(raw)
    projects.set(slug, {
      slug,
      project: parsed.success ? parsed.data : null,
      error: parsed.success ? null : formatIssues(parsed.error),
      canvases: [],
    })
  }

  const screensByCanvas = new Map<string, string[]>()
  for (const path of Object.keys(screenFiles)) {
    const [project, , canvas, , file] = parts(path)
    const key = `${project}/${canvas}`
    screensByCanvas.set(key, [
      ...(screensByCanvas.get(key) ?? []),
      file.replace(/\.tsx$/, ''),
    ])
  }

  for (const [path, raw] of Object.entries(canvasFiles)) {
    const [project, , slug] = parts(path)
    const owner = projects.get(project)
    if (!owner) continue
    const parsed = canvasSchema.safeParse(raw)
    const entry: CanvasEntry = {
      project,
      slug,
      canvas: parsed.success ? parsed.data : null,
      error: parsed.success ? null : formatIssues(parsed.error),
      screens: screensByCanvas.get(`${project}/${slug}`) ?? [],
    }
    owner.canvases.push(entry)
  }

  const sorted = [...projects.values()].sort((a, b) =>
    (a.project?.name ?? a.slug).localeCompare(b.project?.name ?? b.slug),
  )
  for (const project of sorted) {
    project.canvases.sort((a, b) =>
      (a.canvas?.name ?? a.slug).localeCompare(b.canvas?.name ?? b.slug),
    )
  }
  return sorted
}

useWorkspace.getState().hydrate(build(), screenFiles)

if (import.meta.hot) {
  import.meta.hot.accept()
}
