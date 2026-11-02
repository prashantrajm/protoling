import { useHotkeys } from 'react-hotkeys-hook'
import { useEditor } from '@/lib/editor'

/** Shortcuts available on every desktop surface. Canvas-only ones live in CanvasEditor. */
export function GlobalHotkeys() {
  const replayAll = useEditor((s) => s.replayAll)
  const toggleSlowMotion = useEditor((s) => s.toggleSlowMotion)
  const setCommandOpen = useEditor((s) => s.setCommandOpen)

  useHotkeys(
    'mod+k',
    (e) => {
      e.preventDefault()
      setCommandOpen(!useEditor.getState().commandOpen)
    },
    { enableOnFormTags: true },
  )
  useHotkeys('r', replayAll)
  useHotkeys('s', toggleSlowMotion)

  return null
}
