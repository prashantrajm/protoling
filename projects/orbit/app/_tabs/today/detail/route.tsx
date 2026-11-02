import { createFileRoute, Link } from '@tanstack/react-router'
import {
  CalendarDays,
  ChevronLeft,
  Flag,
  FolderInput,
  ListChecks,
  MoreHorizontal,
  Paperclip,
  Tag,
} from 'lucide-react'
import { motion } from 'motion/react'
import { StackScreen, spring, useDismiss, useMotion } from '@/runtime'
import { orbit, tasks } from '../../../../shared/ui'

export const Route = createFileRoute('/orbit/_tabs/today/detail')({
  validateSearch: (search: Record<string, unknown>): { task: string } => ({
    task: typeof search.task === 'string' ? search.task : 'feedback',
  }),
  staticData: {
    screen: {
      name: 'Detail',
      motion: {
        enter: spring(0.5, 0.1),
        rows: spring(0.4, 0),
        press: spring(0.2, 0.3),
      },
    },
    presentation: 'push',
    transition: spring(0.45, 0),
  },
  component: Detail,
})

const rows = [
  { icon: CalendarDays, label: 'Today', accent: true },
  { icon: Flag, label: 'High priority' },
  { icon: Tag, label: 'Design' },
  { icon: ListChecks, label: 'Add subtasks', muted: true },
  { icon: Paperclip, label: 'Add attachment', muted: true },
]

function Detail() {
  const { task: id } = Route.useSearch()
  const enter = useMotion('enter')
  const rowsIn = useMotion('rows')
  const press = useMotion('press')
  const back = useDismiss()
  const task = tasks.find((t) => t.id === id) ?? tasks[0]

  return (
    <StackScreen>
      <div className="flex h-full flex-col bg-white" style={{ color: orbit.ink }}>
        <header className="flex items-center justify-between px-3 pt-[calc(var(--safe-top)+6px)]">
          <button
            type="button"
            onClick={back}
            data-back
            className="flex items-center text-[17px]"
            style={{ color: orbit.accent }}
          >
            <ChevronLeft className="size-7" strokeWidth={2.2} />
            Today
          </button>
          <MoreHorizontal className="mr-2 size-6" style={{ color: orbit.accent }} />
        </header>

        <motion.h1
          data-title
          className="px-5 pt-3 text-[28px] font-bold leading-tight tracking-tight"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={enter}
        >
          {task.title}
        </motion.h1>
        <p className="px-5 pt-1 text-[15px]" style={{ color: orbit.muted }}>
          Add a note…
        </p>

        <ul className="mt-5 px-5">
          {rows.map(({ icon: Icon, label, accent, muted }, i) => (
            <motion.li
              key={label}
              className="flex items-center gap-3 border-b py-3.5"
              style={{ borderColor: orbit.line }}
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...rowsIn, delay: 0.06 + i * 0.04 }}
            >
              <Icon
                className="size-[18px]"
                style={{ color: muted ? orbit.muted : orbit.accent }}
              />
              <span
                className="text-[15px]"
                style={{ color: accent ? orbit.accent : muted ? orbit.muted : orbit.ink }}
              >
                {label}
              </span>
            </motion.li>
          ))}
        </ul>

        <div className="mt-auto px-5 pb-5">
          <motion.div whileTap={{ scale: 0.96 }} transition={press}>
            <Link
              to="/orbit/today/detail/move"
              search={{ task: task.id }}
              data-move
              className="flex h-[50px] w-full items-center justify-center gap-2 rounded-2xl text-[16px] font-semibold"
              style={{ backgroundColor: orbit.accentSoft, color: orbit.accent }}
            >
              <FolderInput className="size-5" />
              Move to…
            </Link>
          </motion.div>
        </div>
      </div>
    </StackScreen>
  )
}
