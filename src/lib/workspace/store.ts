import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'
import type { BoardDefinition } from '@/runtime/board'
import type { Project } from '../schema'
import { fetchMeta, type Meta } from './api'

export interface BoardEntry {
  slug: string
  board: BoardDefinition | null
  error: string | null
}

export interface ProjectEntry {
  slug: string
  project: Project | null
  error: string | null
  /** False until projects/<slug>/app/route.tsx exists. */
  hasApp: boolean
  boards: BoardEntry[]
}

interface WorkspaceState {
  projects: ProjectEntry[]
  meta: Meta | null
  /** Replaces everything read from disk. Called by the registry on load and HMR. */
  hydrate: (projects: ProjectEntry[]) => void
  refreshMeta: () => Promise<void>
}

export const useWorkspace = create<WorkspaceState>((set) => ({
  projects: [],
  meta: null,
  hydrate: (projects) => set({ projects }),
  refreshMeta: async () => {
    const meta = await fetchMeta()
    if (meta) set({ meta })
  },
}))

export function findProject(
  projects: ProjectEntry[],
  slug: string,
): ProjectEntry | undefined {
  return projects.find((p) => p.slug === slug)
}

export function useProjectEntry(slug: string): ProjectEntry | undefined {
  return useWorkspace((s) => findProject(s.projects, slug))
}

/** Project slugs that are mounted as mini apps. */
export function useAppProjects(): string[] {
  // Shallow-compared: a new array on every read would re-render forever.
  return useWorkspace(
    useShallow((s) => s.projects.filter((p) => p.hasApp).map((p) => p.slug)),
  )
}
