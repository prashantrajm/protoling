import { create } from 'zustand'
import type { Canvas, Project } from '../schema'
import { ApiError, api, fetchMeta, type Meta } from './api'

export interface CanvasEntry {
  project: string
  slug: string
  canvas: Canvas | null
  /** Validation error from canvas.json, shown instead of the canvas. */
  error: string | null
  /** Screen file names (without .tsx) found in screens/. */
  screens: string[]
}

export interface ProjectEntry {
  slug: string
  project: Project | null
  error: string | null
  canvases: CanvasEntry[]
}

type SaveState = { status: 'idle' | 'saving' } | { status: 'error'; message: string }

export type ScreenLoader = () => Promise<{ default: unknown }>

interface WorkspaceState {
  projects: ProjectEntry[]
  /** Glob loaders for every screen file, keyed by absolute path. */
  loaders: Record<string, ScreenLoader>
  meta: Meta | null
  save: SaveState
  /** Replaces everything read from disk. Called by the registry on load and HMR. */
  hydrate: (projects: ProjectEntry[], loaders: Record<string, ScreenLoader>) => void
  refreshMeta: () => Promise<void>
  /** Applies a change immediately, then writes canvas.json (debounced). */
  updateCanvas: (
    project: string,
    slug: string,
    update: (canvas: Canvas) => Canvas,
  ) => void
}

const pending = new Map<string, ReturnType<typeof setTimeout>>()
/** Canvases changed locally but not yet confirmed by disk; HMR mustn't clobber them. */
const dirty = new Map<string, Canvas>()

export const useWorkspace = create<WorkspaceState>((set, get) => ({
  projects: [],
  loaders: {},
  meta: null,
  save: { status: 'idle' },

  hydrate: (projects, loaders) => {
    // Keep local edits that are still being written, so an HMR echo of an
    // older save doesn't snap a frame back mid-drag.
    const merged = projects.map((project) => ({
      ...project,
      canvases: project.canvases.map((entry) => {
        const local = dirty.get(`${entry.project}/${entry.slug}`)
        return local ? { ...entry, canvas: local, error: null } : entry
      }),
    }))
    set({ projects: merged, loaders })
  },

  refreshMeta: async () => {
    const meta = await fetchMeta()
    if (meta) set({ meta })
  },

  updateCanvas: (project, slug, update) => {
    const key = `${project}/${slug}`
    const entry = findCanvas(get().projects, project, slug)
    if (!entry?.canvas) return
    const next = update(entry.canvas)
    dirty.set(key, next)
    set({
      projects: get().projects.map((p) =>
        p.slug !== project
          ? p
          : {
              ...p,
              canvases: p.canvases.map((c) =>
                c.slug === slug ? { ...c, canvas: next } : c,
              ),
            },
      ),
    })

    clearTimeout(pending.get(key))
    pending.set(
      key,
      setTimeout(async () => {
        pending.delete(key)
        const toSave = dirty.get(key)
        if (!toSave) return
        set({ save: { status: 'saving' } })
        try {
          await api.saveCanvas(project, slug, toSave)
          if (dirty.get(key) === toSave) dirty.delete(key)
          set({ save: { status: 'idle' } })
          void get().refreshMeta()
        } catch (error) {
          const message = error instanceof ApiError ? error.message : 'Could not save'
          set({ save: { status: 'error', message } })
        }
      }, 250),
    )
  },
}))

export function findProject(
  projects: ProjectEntry[],
  slug: string,
): ProjectEntry | undefined {
  return projects.find((p) => p.slug === slug)
}

export function findCanvas(
  projects: ProjectEntry[],
  project: string,
  slug: string,
): CanvasEntry | undefined {
  return findProject(projects, project)?.canvases.find((c) => c.slug === slug)
}

export function useProject(slug: string): ProjectEntry | undefined {
  return useWorkspace((s) => findProject(s.projects, slug))
}

export function useCanvasEntry(project: string, slug: string): CanvasEntry | undefined {
  return useWorkspace((s) => findCanvas(s.projects, project, slug))
}
