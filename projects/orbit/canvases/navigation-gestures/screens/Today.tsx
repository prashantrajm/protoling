import { Plus, Search } from 'lucide-react'
import { motion } from 'motion/react'
import { defineScreen, spring, useFlow, useMotion } from '@/runtime'
import { Checkbox, orbit, TabBar, tasks } from '../../../shared/ui'

export default defineScreen({
  name: 'Today',
  motion: {
    enter: spring(0.45, 0.15),
    press: spring(0.2, 0.3),
  },
  component: Today,
})

function Today() {
  const enter = useMotion('enter')
  const press = useMotion('press')
  const check = useMotion('press')
  const { navigate } = useFlow()

  return (
    <div className="flex h-full flex-col bg-white" style={{ color: orbit.ink }}>
      <header className="flex items-center justify-between px-5 pb-4 pt-[calc(var(--safe-top)+16px)]">
        <h1 className="text-[34px] font-bold tracking-tight">Today</h1>
        <span className="flex gap-4" style={{ color: orbit.accent }}>
          <Search className="size-6" />
          <Plus className="size-6" />
        </span>
      </header>
      <ul className="flex-1 px-5">
        {tasks.map((task, i) => (
          <motion.li
            key={task.id}
            className="flex cursor-pointer items-center gap-3 border-b py-3.5"
            style={{ borderColor: orbit.line }}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...enter, delay: i * 0.035 }}
            whileTap={{ scale: 0.98, backgroundColor: orbit.surface }}
            onClick={() => navigate('design-onboarding', { task: task.id })}
          >
            <Checkbox checked={task.done} transition={check} />
            <motion.span
              className="flex-1 text-[16px]"
              transition={press}
              style={{ color: task.done ? orbit.muted : orbit.ink }}
            >
              {task.title}
            </motion.span>
          </motion.li>
        ))}
      </ul>
      <TabBar />
    </div>
  )
}
