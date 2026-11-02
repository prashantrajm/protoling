import { createFileRoute } from '@tanstack/react-router'
import { Calendar, CalendarClock, Check, Inbox, Layers, Plus } from 'lucide-react'
import { motion } from 'motion/react'
import { useState } from 'react'
import { spring, useDismiss, useMotion } from '@/runtime'
import { orbit } from '../../../../shared/ui'

/**
 * A sheet: its parent (Detail) stays mounted underneath, the app behind
 * scales down, and dragging the sheet down dismisses it.
 */
export const Route = createFileRoute('/orbit/_tabs/today/detail/move')({
  staticData: {
    screen: {
      name: 'Move to',
      motion: { select: spring(0.25, 0.3) },
    },
    presentation: 'sheet',
    transition: spring(0.5, 0.12),
  },
  component: MoveTo,
})

const lists = [
  { id: 'inbox', label: 'Inbox', icon: Inbox },
  { id: 'today', label: 'Today', icon: Calendar },
  { id: 'upcoming', label: 'Upcoming', icon: CalendarClock },
  { id: 'someday', label: 'Someday', icon: Layers },
]

function MoveTo() {
  const select = useMotion('select')
  const dismiss = useDismiss()
  const [selected, setSelected] = useState('today')

  return (
    <div
      className="px-5 pb-[calc(var(--safe-bottom)+12px)]"
      style={{ color: orbit.ink }}
      data-sheet
    >
      <div className="mx-auto mb-4 mt-2.5 h-[5px] w-9 rounded-full bg-neutral-300" />
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-[17px] font-semibold">Move to…</h2>
        <button
          type="button"
          onClick={dismiss}
          data-close
          className="text-[16px] font-semibold"
          style={{ color: orbit.accent }}
        >
          Done
        </button>
      </div>
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
        style={{ borderColor: orbit.line }}
      >
        <Plus className="size-5" style={{ color: orbit.muted }} />
        New list
      </button>
    </div>
  )
}
