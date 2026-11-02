import { CalendarDays, ChevronLeft, Flag, MoreHorizontal, Tag } from 'lucide-react'
import { motion } from 'motion/react'
import { defineScreen, spring, useFlow, useMotion } from '@/runtime'
import { orbit, tasks } from '../../../shared/ui'

export default defineScreen({
  name: 'Detail',
  motion: {
    enter: spring(0.5, 0.1),
    rows: spring(0.4, 0),
  },
  component: Detail,
})

const fields = [
  { icon: CalendarDays, label: 'Due', value: 'Today, 4:00 PM' },
  { icon: Flag, label: 'Priority', value: 'High' },
  { icon: Tag, label: 'List', value: 'Focus' },
]

function Detail() {
  const enter = useMotion('enter')
  const rows = useMotion('rows')
  const { back, canGoBack, params } = useFlow()
  const task = tasks.find((t) => t.id === params.task) ?? tasks[0]

  return (
    <div className="flex h-full flex-col bg-white" style={{ color: orbit.ink }}>
      <header className="flex items-center justify-between px-3 pb-2 pt-[calc(var(--safe-top)+6px)]">
        <button
          type="button"
          onClick={back}
          className="flex items-center text-[17px]"
          style={{ color: orbit.accent, opacity: canGoBack ? 1 : 0.4 }}
        >
          <ChevronLeft className="size-7" strokeWidth={2.2} />
          Today
        </button>
        <MoreHorizontal className="mr-2 size-6" style={{ color: orbit.accent }} />
      </header>

      <div className="px-5 pt-3">
        <motion.h1
          layoutId={`task-title-${task.id}`}
          className="inline-block text-[28px] font-bold leading-tight tracking-tight"
          transition={enter}
        >
          {task.title}
        </motion.h1>
        <motion.p
          className="mt-2 text-[15px] leading-relaxed"
          style={{ color: orbit.muted }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...enter, delay: 0.08 }}
        >
          Collect comments from the design review, group them by screen and reply before
          the sprint planning session.
        </motion.p>
      </div>

      <ul
        className="mx-5 mt-6 overflow-hidden rounded-2xl"
        style={{ backgroundColor: orbit.surface }}
      >
        {fields.map(({ icon: Icon, label, value }, i) => (
          <motion.li
            key={label}
            className="flex items-center gap-3 border-b px-4 py-3.5 last:border-0"
            style={{ borderColor: orbit.line }}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...rows, delay: 0.12 + i * 0.05 }}
          >
            <Icon className="size-[18px]" style={{ color: orbit.accent }} />
            <span className="flex-1 text-[15px]">{label}</span>
            <span className="text-[15px]" style={{ color: orbit.muted }}>
              {value}
            </span>
          </motion.li>
        ))}
      </ul>
    </div>
  )
}
