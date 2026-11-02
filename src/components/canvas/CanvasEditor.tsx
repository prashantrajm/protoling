import {
  applyNodeChanges,
  Background,
  BackgroundVariant,
  type Edge,
  MiniMap,
  type NodeChange,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useNavigate } from '@tanstack/react-router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import { toast } from 'sonner'
import { frameKey, resolvedTheme, useEditor } from '@/lib/editor'
import { resolveNavigation } from '@/lib/flow'
import type { Canvas } from '@/lib/schema'
import { frameVariants } from '@/lib/variants'
import { canEdit } from '@/lib/workspace/api'
import { loadScreen, screenPath } from '@/lib/workspace/screens'
import { useWorkspace } from '@/lib/workspace/store'
import type { FlowControls, FlowParams } from '@/runtime/context'
import { Inspector } from '../inspector/Inspector'
import { CanvasToolbar } from './CanvasToolbar'
import { ConnectorEdge, type ConnectorEdgeType } from './ConnectorEdge'
import { useCanvasUi } from './canvas-ui'
import { FrameNode, type FrameNodeType } from './FrameNode'

const nodeTypes = { frame: FrameNode }
const edgeTypes = { connector: ConnectorEdge }

interface Props {
  project: string
  projectName: string
  slug: string
  canvas: Canvas
}

export function CanvasEditor(props: Props) {
  return (
    <ReactFlowProvider>
      <Editor {...props} />
    </ReactFlowProvider>
  )
}

function Editor({ project, projectName, slug, canvas }: Props) {
  const ui = useCanvasUi()
  const theme = useEditor((s) => s.theme)
  const updateCanvas = useWorkspace((s) => s.updateCanvas)
  const loaders = useWorkspace((s) => s.loaders)
  const { fitView, getZoom } = useReactFlow()
  const navigate = useNavigate()
  const dragging = useRef(false)

  useEffect(() => ui.open(`${project}/${slug}`), [ui.open, project, slug])

  // ---- Flow on the canvas: navigating highlights the connector and moves to the target.
  const focusFrame = useCallback(
    (id: string) => {
      const zoom = getZoom()
      void fitView({ nodes: [{ id }], duration: 500, minZoom: zoom, maxZoom: zoom })
    },
    [fitView, getZoom],
  )

  const flows = useMemo(() => {
    const cache = new Map<string, FlowControls>()
    return (frameId: string): FlowControls => {
      let flow = cache.get(frameId)
      if (!flow) {
        const incoming = canvas.connectors.find((c) => c.to === frameId)
        flow = {
          navigate: (target?: string, params?: FlowParams) => {
            const result = resolveNavigation(canvas, frameId, target)
            if (!result) {
              toast(
                `Nothing to navigate to${target ? ` ("${target}")` : ''} from this frame`,
              )
              return
            }
            const state = useCanvasUi.getState()
            if (result.connector) state.highlight(result.connector.id)
            state.selectFrame(result.frame.id)
            state.replayFrame(result.frame.id, params)
            focusFrame(result.frame.id)
          },
          back: () => {
            if (!incoming) return
            const state = useCanvasUi.getState()
            state.highlight(incoming.id)
            state.selectFrame(incoming.from)
            focusFrame(incoming.from)
          },
          canGoBack: Boolean(incoming),
          params: {},
        }
        cache.set(frameId, flow)
      }
      return flow
    }
  }, [canvas, focusFrame])

  // ---- Nodes: positions are local while dragging, then saved to canvas.json.
  const toNodes = useCallback(
    (): FrameNodeType[] =>
      canvas.frames.map((frame) => ({
        id: frame.id,
        type: 'frame',
        position: frame.position,
        dragHandle: '.sb-drag',
        selected: frame.id === useCanvasUi.getState().selectedFrame,
        data: { frame, canvas, project, canvasSlug: slug, flow: flows },
      })),
    [canvas, flows, project, slug],
  )
  const [nodes, setNodes] = useState<FrameNodeType[]>(toNodes)

  useEffect(() => {
    if (!dragging.current) setNodes(toNodes())
  }, [toNodes])

  useEffect(() => {
    setNodes((current) =>
      current.map((n) => ({ ...n, selected: n.id === ui.selectedFrame })),
    )
  }, [ui.selectedFrame])

  const onNodesChange = useCallback((changes: NodeChange<FrameNodeType>[]) => {
    // Selection is owned by the canvas UI store, not React Flow.
    const relevant = changes.filter((c) => c.type !== 'select')
    if (relevant.length) setNodes((current) => applyNodeChanges(relevant, current))
  }, [])

  const edges = useMemo<ConnectorEdgeType[]>(
    () =>
      canvas.connectors.map((connector) => ({
        id: connector.id,
        source: connector.from,
        target: connector.to,
        type: 'connector',
        selected: connector.id === ui.selectedConnector,
        data: { connector },
      })),
    [canvas.connectors, ui.selectedConnector],
  )

  // ---- Shortcuts that only make sense on a canvas.
  const selected = canvas.frames.find((f) => f.id === ui.selectedFrame)

  useHotkeys('escape', () => ui.selectFrame(null))
  useHotkeys('i', () => ui.toggleInspector())
  useHotkeys('shift+1', () => void fitView({ duration: 400, padding: 0.15 }))
  useHotkeys('f', () => {
    if (!selected) return
    const variant = useEditor.getState().variants[frameKey(project, slug, selected.id)]
    void navigate({
      to: '/p/$project/$canvas/focus/$frame',
      params: { project, canvas: slug, frame: selected.id },
      search: { v: variant && variant !== 'default' ? variant : undefined },
    })
  }, [selected, project, slug])
  useHotkeys(
    '1,2,3,4,5,6,7,8,9',
    async (event) => {
      if (!selected) return
      const path = screenPath(project, slug, selected.screen)
      const loaded = await loadScreen(path, loaders[path])
      const options = frameVariants(selected, loaded.ok ? loaded.screen : null)
      const option = options[Number(event.key) - 1]
      if (!option) return
      useEditor.getState().setVariant(frameKey(project, slug, selected.id), option.id)
      ui.replayFrame(selected.id)
    },
    [selected, project, slug, loaders],
  )

  return (
    <div className="flex h-full">
      <div className="relative min-w-0 flex-1">
        <ReactFlow<FrameNodeType, Edge>
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={onNodesChange}
          onEdgeClick={(_, edge) => ui.selectConnector(edge.id)}
          onPaneClick={() => ui.selectFrame(null)}
          onNodeDragStart={() => {
            dragging.current = true
          }}
          onNodeDragStop={(_, __, moved) => {
            dragging.current = false
            const positions = new Map(moved.map((n) => [n.id, n.position]))
            updateCanvas(project, slug, (c) => ({
              ...c,
              frames: c.frames.map((f) => {
                const p = positions.get(f.id)
                return p
                  ? { ...f, position: { x: Math.round(p.x), y: Math.round(p.y) } }
                  : f
              }),
            }))
          }}
          nodesDraggable={canEdit}
          nodesConnectable={false}
          elementsSelectable
          onlyRenderVisibleElements
          panOnScroll
          zoomOnPinch
          minZoom={0.1}
          maxZoom={2}
          fitView
          fitViewOptions={{ padding: 0.15 }}
          colorMode={resolvedTheme(theme)}
          deleteKeyCode={null}
          attributionPosition="bottom-left"
          className="bg-canvas"
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={16}
            size={1.4}
            color="var(--canvas-dot)"
          />
          <MiniMap
            pannable
            zoomable
            style={{ width: 150, height: 96 }}
            className="!bg-background/80 !rounded-lg !border"
            maskColor="color-mix(in oklab, var(--canvas) 70%, transparent)"
            nodeColor="var(--frame-border)"
            nodeBorderRadius={12}
          />
        </ReactFlow>
        <CanvasToolbar
          project={project}
          projectName={projectName}
          canvasName={canvas.name}
        />
      </div>
      {ui.inspectorOpen && <Inspector project={project} slug={slug} canvas={canvas} />}
    </div>
  )
}
