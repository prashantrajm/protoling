import type { AnyRouter } from '@tanstack/react-router'
import { create } from 'zustand'
import type { ScreenSnapshot } from '@/lib/bridge'

/** State for the open board. Reset when another board opens. */
interface BoardUi {
  key: string
  selected: string | null
  routers: Record<string, AnyRouter>
  snapshots: Record<string, ScreenSnapshot | null>
  replay: Record<string, number>
  inspectorOpen: boolean
  open: (key: string) => void
  select: (frameId: string | null) => void
  setRouter: (frameId: string, router: AnyRouter | null) => void
  setSnapshot: (frameId: string, snapshot: ScreenSnapshot | null) => void
  replayFrame: (frameId: string) => void
  toggleInspector: () => void
}

export const useBoardUi = create<BoardUi>((set, get) => ({
  key: '',
  selected: null,
  routers: {},
  snapshots: {},
  replay: {},
  inspectorOpen: true,
  // Only the selection resets. Frames register their routers and snapshots
  // in effects, which run before this parent effect; frame ids are unique
  // per board, so entries from other boards can't collide.
  open: (key) => {
    if (get().key !== key) set({ key, selected: null })
  },
  select: (selected) => set({ selected }),
  setRouter: (id, router) => {
    const routers = { ...get().routers }
    if (router) routers[id] = router
    else delete routers[id]
    set({ routers })
  },
  setSnapshot: (id, snapshot) =>
    set({ snapshots: { ...get().snapshots, [id]: snapshot } }),
  replayFrame: (id) =>
    set({ replay: { ...get().replay, [id]: (get().replay[id] ?? 0) + 1 } }),
  toggleInspector: () => set({ inspectorOpen: !get().inspectorOpen }),
}))
