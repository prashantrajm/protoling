import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { motion } from 'motion/react'
import { useState } from 'react'
import { StackScreen, spring, tween, useMotion, useVariant } from '@/runtime'
import { Checkbox, tasks as initialTasks, orbit, ProgressRing } from '../../../shared/ui'

export const Route = createFileRoute('/orbit/_tabs/today')({
  staticData: {
    screen: {
      name: 'Today',
      motion: {
        enter: spring(0.45, 0.15),
        segment: spring(0.35, 0.2),
        check: spring(0.3, 0.3),
        progress: spring(0.6, 0),
      },
      variants: {
        'soft-spring': {
          name: 'Soft spring',
          motion: { enter: spring(0.7, 0.35), segment: spring(0.55, 0.4) },
        },
        'quick-fade': {
          name: 'Quick fade',
          motion: { enter: tween(0.18, 'easeOut'), segment: tween(0.15, 'easeOut') },
        },
      },
    },
  },
  component: Today,
})

const segments = [
  { id: 'all', label: 'All' },
  { id: 'focus', label: 'Focus' },
  { id: 'personal', label: 'Personal' },
] as const

function Today() {
  const enter = useMotion('enter')
  const segment = useMotion('segment')
  const check = useMotion('check')
  const progress = useMotion('progress')
  const navigate = useNavigate()
  // A structural variant: "Quick fade" drops the slide and only fades.
  const fadeOnly = useVariant().id === 'quick-fade'

  const [tasks, setTasks] = useState(initialTasks)
  const [filter, setFilter] = useState<(typeof segments)[number]['id']>('all')
  const visible = tasks.filter((t) => filter === 'all' || t.list === filter)

  return (
    <StackScreen>
      <div className="flex h-full flex-col bg-white" style={{ color: orbit.ink }}>
        <header className="flex items-end justify-between px-5 pb-4 pt-[calc(var(--safe-top)+20px)]">
          <motion.h1
            className="text-[34px] font-bold tracking-tight"
            initial={{ opacity: 0, y: fadeOnly ? 0 : 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={enter}
          >
            Today
          </motion.h1>
          <ProgressRing
            done={tasks.filter((t) => t.done).length}
            total={tasks.length}
            transition={progress}
          />
        </header>

        <div
          className="mx-5 mb-3 flex rounded-xl p-1"
          style={{ backgroundColor: orbit.surface }}
        >
          {segments.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setFilter(s.id)}
              className="relative flex-1 rounded-lg py-1.5 text-[13px] font-semibold"
              style={{ color: filter === s.id ? '#fff' : orbit.muted }}
            >
              {filter === s.id && (
                <motion.span
                  layoutId="segment"
                  className="absolute inset-0 rounded-lg"
                  style={{ backgroundColor: orbit.accent }}
                  transition={segment}
                />
              )}
              <span className="relative">{s.label}</span>
            </button>
          ))}
        </div>

        <ul className="flex-1 overflow-y-auto px-5">
          {visible.map((task, i) => (
            <motion.li
              key={`${filter}-${task.id}`}
              className="flex items-center gap-3 border-b py-3.5"
              style={{ borderColor: orbit.line }}
              initial={{ opacity: 0, y: fadeOnly ? 0 : 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...enter, delay: i * 0.04 }}
            >
              <button
                type="button"
                aria-label={task.done ? 'Mark as not done' : 'Mark as done'}
                onClick={() =>
                  setTasks((all) =>
                    all.map((t) => (t.id === task.id ? { ...t, done: !t.done } : t)),
                  )
                }
              >
                <Checkbox checked={task.done} transition={check} />
              </button>
              <motion.button
                type="button"
                data-task={task.id}
                className="flex-1 text-left text-[16px]"
                animate={{ color: task.done ? orbit.muted : orbit.ink }}
                onClick={() =>
                  navigate({ to: '/orbit/today/detail', search: { task: task.id } })
                }
              >
                {task.title}
              </motion.button>
            </motion.li>
          ))}
        </ul>
      </div>
    </StackScreen>
  )
}
