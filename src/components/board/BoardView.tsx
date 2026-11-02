import {
  Background,
  BackgroundVariant,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useEffect, useMemo } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import { Inspector } from '@/components/inspector/Inspector'
import type { ResolvedBoard } from '@/lib/boards'
import { getDevice } from '@/lib/devices'
import { resolvedTheme, useEditor } from '@/lib/editor'
import { getHostRouter } from '@/lib/router-registry'
import { deriveArrows, fileForRoute, projectScreens } from '@/lib/screens'
import { setVariantInUrl } from '@/runtime/screen'
import { ArrowEdge, type ArrowEdgeType } from './ArrowEdge'
import { BoardToolbar } from './BoardToolbar'
import { useBoardUi } from './board-ui'
import { FrameNode, type FrameNodeType } from './FrameNode'

const nodeTypes = { frame: FrameNode }
const edgeTypes = { arrow: ArrowEdge }
const gap = 120

export function BoardView(props: {
  project: string
  projectName: string
  device?: string
  board: ResolvedBoard
}) {
  return (
    <ReactFlowProvider>
      <Board {...props} />
    </ReactFlowProvider>
  )
}

function Board({
  project,
  projectName,
  device: deviceId,
  board,
}: {
  project: string
  projectName: string
  device?: string
  board: ResolvedBoard
}) {
  const theme = useEditor((s) => s.theme)
  const ui = useBoardUi()
  const { fitView } = useReactFlow()
  const device = getDevice(deviceId)

  useEffect(() => ui.open(`${project}/${board.slug}`), [ui.open, project, board.slug])

  // Frames in a row, in board order. Positions are derived, never stored.
  // Selection is read by each frame from the store, not passed here: a new
  // nodes array mid-click replaces node DOM, losing the click and restarting
  // the live app inside the frame.
  const nodes = useMemo<FrameNodeType[]>(
    () =>
      board.frames.map((frame, i) => ({
        id: frame.id,
        type: 'frame',
        position: { x: i * (device.width + gap), y: 0 },
        draggable: false,
        data: { frame, project, device },
      })),
    [board.frames, device, project],
  )

  const edges = useMemo<ArrowEdgeType[]>(() => {
    const screens = new Map(
      projectScreens(getHostRouter(), project).map((s) => [s.routeId, s]),
    )
    return deriveArrows(board.frames, screens).map((arrow) => ({
      id: arrow.id,
      source: arrow.from,
      target: arrow.to,
      type: 'arrow',
      selectable: false,
      data: { arrow },
    }))
  }, [board.frames, project])

  const snapshot = ui.selected ? (ui.snapshots[ui.selected] ?? null) : null
  const selectedRouter = ui.selected ? ui.routers[ui.selected] : undefined

  useHotkeys('escape', () => ui.select(null))
  useHotkeys('i', () => ui.toggleInspector())
  useHotkeys('shift+1', () => void fitView({ duration: 400, padding: 0.12 }))
  useHotkeys(
    '1,2,3,4,5,6,7,8,9',
    (e) => {
      const option = snapshot?.variants[Number(e.key) - 1]
      if (option && snapshot && selectedRouter)
        setVariantInUrl(selectedRouter, snapshot.key, option.id)
    },
    [snapshot, selectedRouter],
  )

  return (
    <div className="flex h-full">
      <div className="relative min-w-0 flex-1">
        <ReactFlow<FrameNodeType, ArrowEdgeType>
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          // Also what keeps frames interactive: React Flow sets pointer-events:
          // none on nodes that aren't draggable, selectable or clickable.
          onNodeClick={(_, node) => ui.select(node.id)}
          onPaneClick={(event) => {
            // A tap inside a live app can re-render or remove its target, which
            // React Flow then reports as a pane click. Only real background
            // clicks deselect.
            const target = event.target as Element
            if (!target.isConnected || target.closest('.react-flow__node')) return
            ui.select(null)
          }}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          onlyRenderVisibleElements
          panOnScroll
          zoomOnPinch
          minZoom={0.1}
          maxZoom={2}
          fitView
          fitViewOptions={{ padding: 0.12 }}
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
        </ReactFlow>
        <BoardToolbar
          project={project}
          projectName={projectName}
          boardName={board.name}
        />
        {board.frames.length === 0 && (
          <p className="absolute inset-0 grid place-items-center text-sm text-muted-foreground">
            {board.error || 'No screens yet. Add staticData.screen to a route.'}
          </p>
        )}
      </div>
      {ui.inspectorOpen && (
        <Inspector
          screen={snapshot}
          file={snapshot ? fileForRoute(snapshot.routeId, project) : null}
          onVariant={(id) =>
            snapshot &&
            selectedRouter &&
            setVariantInUrl(selectedRouter, snapshot.key, id)
          }
          empty={
            ui.selected ? undefined : (
              <p>
                Select a frame to see its screen's variants, motion values and handoff
                code.
              </p>
            )
          }
        />
      )}
    </div>
  )
}
