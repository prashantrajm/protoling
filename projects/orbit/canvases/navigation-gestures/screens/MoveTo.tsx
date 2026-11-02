import { Calendar, CalendarClock, Check, Inbox, Layers, Plus } from 'lucide-react'
import { animate, motion, type PanInfo, useMotionValue, useTransform } from 'motion/react'
import { useEffect, useState } from 'react'
import { defineScreen, spring, useFlow, useMotion } from '@/runtime'
import { orbit, tasks } from '../../../shared/ui'

export default defineScreen({
  name: 'MoveTo',
  motion: {
    present: spring(0.5, 0.12),
    dismiss: spring(0.35, 0),
    snapBack: spring(0.4, 0.3),
    select: spring(0.25, 0.3),
  },
  variants: {
    'springy-sheet': {
      name: 'Springy sheet',
      motion: { present: spring(0.6, 0.3), snapBack: spring(0.5, 0.45) },
    },
  },
  component: MoveTo,
})

const lists = [
  { id: 'inbox', label: 'Inbox', icon: Inbox },
  { id: 'today', label: 'Today', icon: Calendar },
  { id: 'upcoming', label: 'Upcoming', icon: CalendarClock },
  { id: 'someday', label: 'Someday', icon: Layers },
]

const sheetHeight = 420

/**
 * Bottom sheet with drag to dismiss. Dragging up rubber-bands; releasing
 * past a third of the height, or flicking down fast, dismisses.
 */
function MoveTo() {
  const present = useMotion('present')
  const dismiss = useMotion('dismiss')
  const snapBack = useMotion('snapBack')
  const select = useMotion('select')
  const { back } = useFlow()
  const [selected, setSelected] = useState('today')

  const y = useMotionValue(sheetHeight)
  const dim = useTransform(y, [0, sheetHeight], [0.4, 0])

  useEffect(() => {
    const controls = animate(y, 0, present)
    return () => controls.stop()
  }, [present, y])

  function close() {
    animate(y, sheetHeight, { ...dismiss, onComplete: back })
  }

  function onDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.y > sheetHeight / 3 || info.velocity.y > 600) close()
    else animate(y, 0, snapBack)
  }

  return (
    <div className="relative h-full overflow-hidden" style={{ color: orbit.ink }}>
      {/* The screen underneath, static. */}
      <div className="absolute inset-0 bg-white px-5 pt-[calc(var(--safe-top)+16px)]">
        <h1 className="pb-4 text-[34px] font-bold tracking-tight">Today</h1>
        {tasks.slice(0, 5).map((t) => (
          <p
            key={t.id}
            className="border-b py-3.5 text-[16px]"
            style={{ borderColor: orbit.line }}
          >
            {t.title}
          </p>
        ))}
      </div>

      <motion.button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black"
        style={{ opacity: dim }}
        onClick={close}
      />

      <motion.div
        className="absolute inset-x-0 bottom-0 rounded-t-[28px] bg-white px-5 pb-[calc(var(--safe-bottom)+12px)] shadow-[0_-8px_40px_rgba(0,0,0,0.12)]"
        style={{ y, height: sheetHeight }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0.08, bottom: 1 }}
        dragMomentum={false}
        onDragEnd={onDragEnd}
      >
        <div className="mx-auto mb-4 mt-2.5 h-[5px] w-9 rounded-full bg-neutral-300" />
        <h2 className="mb-2 text-[17px] font-semibold">Move to…</h2>
        <ul>
          {lists.map(({ id, label, icon: Icon }) => (
            <li key={id}>
              <button
                type="button"
                onClick={() => setSelected(id)}
                className="flex w-full items-center gap-3 py-3 text-left text-[16px]"
              >
                <Icon className="size-5" style={{ color: orbit.muted }} />
                <span
                  className="flex-1"
                  style={{ color: selected === id ? orbit.accent : orbit.ink }}
                >
                  {label}
                </span>
                {selected === id && (
                  <motion.span layoutId="move-check" transition={select}>
                    <Check
                      className="size-5"
                      style={{ color: orbit.accent }}
                      strokeWidth={2.5}
                    />
                  </motion.span>
                )}
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          className="mt-1 flex w-full items-center gap-3 border-t py-3.5 text-[16px]"
          style={{ borderColor: orbit.line, color: orbit.ink }}
        >
          <Plus className="size-5" style={{ color: orbit.muted }} />
          New list
        </button>
      </motion.div>
    </div>
  )
}
