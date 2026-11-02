import { getHostRouter } from './router-registry'
import { projectScreens, screenForUrl } from './screens'
import type { ProjectEntry } from './workspace/store'

/** Slug of the board every project gets automatically: one frame per screen. */
export const screensBoard = 'screens'

export interface ResolvedFrame {
  id: string
  url: string
  label: string
  routeId: string | null
}

export interface ResolvedBoard {
  slug: string
  name: string
  description?: string
  frames: ResolvedFrame[]
  error?: string
}

export function projectBoards(entry: ProjectEntry): ResolvedBoard[] {
  return [
    screensBoardFor(entry.slug),
    ...entry.boards.map((b) => curatedBoard(entry.slug, b)),
  ]
}

export function findBoard(entry: ProjectEntry, slug: string): ResolvedBoard | undefined {
  return projectBoards(entry).find((b) => b.slug === slug)
}

function screensBoardFor(project: string): ResolvedBoard {
  const screens = projectScreens(getHostRouter(), project).filter((s) => s.url)
  return {
    slug: screensBoard,
    name: 'All screens',
    description: 'Every screen in the app, from its routes.',
    frames: screens.map((s, i) => ({
      id: `${screensBoard}-${i}`,
      url: s.url as string,
      label: s.name,
      routeId: s.routeId,
    })),
  }
}

function curatedBoard(
  project: string,
  entry: ProjectEntry['boards'][number],
): ResolvedBoard {
  if (!entry.board)
    return { slug: entry.slug, name: entry.slug, frames: [], error: entry.error ?? '' }
  const router = getHostRouter()
  const names = new Map(projectScreens(router, project).map((s) => [s.routeId, s.name]))
  return {
    slug: entry.slug,
    name: entry.board.name,
    description: entry.board.description,
    frames: entry.board.frames.map((f, i) => {
      const routeId = screenForUrl(router, f.url)
      return {
        id: `${entry.slug}-${i}`,
        url: f.url,
        label: f.label ?? (routeId ? (names.get(routeId) ?? f.url) : f.url),
        routeId,
      }
    }),
  }
}
