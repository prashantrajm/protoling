import { create } from 'zustand'
import type { FlowParams } from '@/runtime/context'

/** UI state for the open canvas. Reset whenever another canvas opens. */
interface CanvasUi {
  key: string
  selectedFrame: string | null
  selectedConnector: string | null
  /** Connector flashing after a screen navigated along it. */
  highlighted: string | null
  replay: Record<string, number>
  params: Record<string, FlowParams>
  inspectorOpen: boolean
  open: (key: string) => void
  selectFrame: (id: string | null) => void
  selectConnector: (id: string | null) => void
  /** Remounts a frame, optionally handing it navigation params. */
  replayFrame: (id: string, params?: FlowParams) => void
  highlight: (connectorId: string) => void
  toggleInspector: () => void
}

let highlightTimer: ReturnType<typeof setTimeout> | undefined

export const useCanvasUi = create<CanvasUi>((set, get) => ({
  key: '',
  selectedFrame: null,
  selectedConnector: null,
  highlighted: null,
  replay: {},
  params: {},
  inspectorOpen: true,
  open: (key) => {
    if (get().key === key) return
    set({
      key,
      selectedFrame: null,
      selectedConnector: null,
      highlighted: null,
      replay: {},
      params: {},
    })
  },
  selectFrame: (selectedFrame) => set({ selectedFrame, selectedConnector: null }),
  selectConnector: (selectedConnector) => set({ selectedConnector, selectedFrame: null }),
  replayFrame: (id, params) =>
    set({
      replay: { ...get().replay, [id]: (get().replay[id] ?? 0) + 1 },
      params: params ? { ...get().params, [id]: params } : get().params,
    }),
  highlight: (highlighted) => {
    clearTimeout(highlightTimer)
    set({ highlighted })
    highlightTimer = setTimeout(() => set({ highlighted: null }), 1400)
  },
  toggleInspector: () => set({ inspectorOpen: !get().inspectorOpen }),
}))
