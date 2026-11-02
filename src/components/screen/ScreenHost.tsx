import { LayoutGroup, MotionConfig } from 'motion/react'
import {
  Component,
  type CSSProperties,
  type ReactNode,
  Suspense,
  use,
  useMemo,
} from 'react'
import { DeviceChrome } from '@/components/device/StatusBar'
import type { Device } from '@/lib/devices'
import type { Frame } from '@/lib/schema'
import { cn } from '@/lib/utils'
import { resolveTokens, resolveVariant } from '@/lib/variants'
import {
  loadScreen,
  screenPath,
  screenVersion,
  useScreenLoader,
} from '@/lib/workspace/screens'
import { type FlowControls, ScreenContext, type ScreenMode } from '@/runtime/context'

export interface ScreenHostProps {
  project: string
  canvas: string
  frame: Frame
  device: Device
  mode: ScreenMode
  variantId?: string
  playing?: boolean
  /** Change to remount the screen, replaying its entrance animations. */
  replayKey?: number
  timeScale?: number
  /**
   * Namespace for layoutId. Defaults to the frame id so frames on a canvas
   * never animate into each other; the flow player passes one shared scope
   * so shared-element transitions work between screens.
   */
  layoutScope?: string
  flow: FlowControls
  className?: string
  style?: CSSProperties
}

/**
 * One screen at exact device size. The box is a size container, so screens
 * can use cqw/cqh and container queries instead of the browser's viewport.
 * `transform` makes it the containing block for position: fixed children.
 */
export function ScreenHost(props: ScreenHostProps) {
  const { device, mode } = props
  const onPhone = mode === 'device'
  const path = screenPath(props.project, props.canvas, props.frame.screen)
  const loader = useScreenLoader(path)
  const version = screenVersion(path, loader)

  const style = {
    width: onPhone ? '100%' : device.width,
    height: onPhone ? '100%' : device.height,
    borderRadius: onPhone ? 0 : device.radius,
    containerType: 'size',
    '--safe-top': onPhone ? 'env(safe-area-inset-top)' : `${device.safeArea.top}px`,
    '--safe-right': onPhone ? 'env(safe-area-inset-right)' : `${device.safeArea.right}px`,
    '--safe-bottom': onPhone
      ? 'env(safe-area-inset-bottom)'
      : `${device.safeArea.bottom}px`,
    '--safe-left': onPhone ? 'env(safe-area-inset-left)' : `${device.safeArea.left}px`,
    ...props.style,
  } as CSSProperties

  return (
    <div
      className={cn(
        'sb-screen relative isolate overflow-hidden bg-white text-left [transform:translateZ(0)]',
        props.className,
      )}
      style={style}
      data-paused={props.playing === false ? '' : undefined}
    >
      <ScreenErrorBoundary key={version ?? path}>
        <Suspense fallback={null}>
          <LoadedScreen {...props} path={path} />
        </Suspense>
      </ScreenErrorBoundary>
    </div>
  )
}

function LoadedScreen(props: ScreenHostProps & { path: string }) {
  const loader = useScreenLoader(props.path)
  const loaded = use(loadScreen(props.path, loader))
  const { frame, device, mode, flow } = props
  const definition = loaded.ok ? loaded.screen : null
  const option = useMemo(
    () => resolveVariant(frame, definition, props.variantId),
    [frame, definition, props.variantId],
  )
  const tokens = useMemo(
    () => resolveTokens(definition?.motion ?? {}, option),
    [definition, option],
  )
  const variant = useMemo(
    () => ({ id: option.id, name: option.name, index: option.index }),
    [option.id, option.name, option.index],
  )
  const playing = props.playing ?? true
  const timeScale = props.timeScale ?? 1
  const context = useMemo(
    () => ({
      frameId: frame.id,
      device,
      mode,
      variant,
      tokens,
      timeScale,
      playing,
      flow,
    }),
    [frame.id, device, mode, variant, tokens, timeScale, playing, flow],
  )

  if (!loaded.ok) return <ScreenError message={loaded.error} />
  const Screen = loaded.screen.component
  const showChrome = mode !== 'device'

  return (
    <ScreenContext value={context}>
      <MotionConfig reducedMotion="user" skipAnimations={!playing}>
        <LayoutGroup id={props.layoutScope ?? `frame-${frame.id}`}>
          <div className="absolute inset-0" key={`${variant.id}:${props.replayKey ?? 0}`}>
            <Screen />
          </div>
        </LayoutGroup>
      </MotionConfig>
      {showChrome && (
        <DeviceChrome
          device={device}
          tone={loaded.screen.statusBar ?? 'dark'}
          statusBar={frame.statusBar}
        />
      )}
    </ScreenContext>
  )
}

function ScreenError({ message }: { message: string }) {
  return (
    <div className="absolute inset-0 overflow-auto bg-red-50 p-5 pt-16 font-mono text-[12px] leading-relaxed text-red-700">
      <p className="mb-2 font-sans text-[13px] font-semibold">
        This screen failed to render
      </p>
      <pre className="whitespace-pre-wrap">{message}</pre>
    </div>
  )
}

class ScreenErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  render() {
    if (this.state.error) return <ScreenError message={this.state.error.message} />
    return this.props.children
  }
}
