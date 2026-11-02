import type { BoardDefinition } from '@/runtime/board'
import { formatIssues, projectSchema } from '../schema'
import { type ProjectEntry, useWorkspace } from './store'

/**
 * Discovers project metadata and boards under projects/. The apps themselves
 * are TanStack route files, mounted by vite.config.ts.
 *
 * This module accepts its own hot updates and exports nothing, so editing a
 * project.json or board updates the store without a reload.
 */
const projectFiles = import.meta.glob<unknown>('/projects/*/project.json', {
  eager: true,
  import: 'default',
})
// Keys only: is there an app/ to mount?
const appRoots = import.meta.glob('/projects/*/app/route.tsx')
const boardFiles = import.meta.glob<unknown>('/projects/*/boards/*.ts', {
  eager: true,
  import: 'default',
})

function segment(path: string, index: number): string {
  return path.split('/')[index + 2]
}

function isBoard(value: unknown): value is BoardDefinition {
  const b = value as BoardDefinition | null
  return typeof b?.name === 'string' && Array.isArray(b.frames)
}

function build(): ProjectEntry[] {
  const projects: ProjectEntry[] = Object.entries(projectFiles).map(([path, raw]) => {
    const slug = segment(path, 0)
    const parsed = projectSchema.safeParse(raw)
    return {
      slug,
      project: parsed.success ? parsed.data : null,
      error: parsed.success ? null : formatIssues(parsed.error),
      hasApp: `/projects/${slug}/app/route.tsx` in appRoots,
      boards: [],
    }
  })
  for (const [path, raw] of Object.entries(boardFiles)) {
    const owner = projects.find((p) => p.slug === segment(path, 0))
    if (!owner) continue
    const slug = segment(path, 2).replace(/\.ts$/, '')
    owner.boards.push(
      isBoard(raw)
        ? { slug, board: raw, error: null }
        : {
            slug,
            board: null,
            error: `${path} must \`export default defineBoard({...})\``,
          },
    )
  }
  for (const p of projects) p.boards.sort((a, b) => a.slug.localeCompare(b.slug))
  return projects.sort((a, b) =>
    (a.project?.name ?? a.slug).localeCompare(b.project?.name ?? b.slug),
  )
}

useWorkspace.getState().hydrate(build())

if (import.meta.hot) {
  import.meta.hot.accept()
}
