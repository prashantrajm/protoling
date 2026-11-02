import { createFileRoute } from '@tanstack/react-router'
import { Search as SearchIcon } from 'lucide-react'
import { motion } from 'motion/react'
import { spring, useMotion } from '@/runtime'
import { orbit, tasks } from '../../shared/ui'

export const Route = createFileRoute('/orbit/_tabs/search')({
  staticData: {
    screen: { name: 'Search', motion: { enter: spring(0.4, 0.1) } },
  },
  component: Search,
})

function Search() {
  const enter = useMotion('enter')
  return (
    <div
      className="h-full bg-white px-5 pt-[calc(var(--safe-top)+20px)]"
      style={{ color: orbit.ink }}
    >
      <h1 className="text-[34px] font-bold tracking-tight">Search</h1>
      <motion.label
        className="mt-3 flex items-center gap-2 rounded-xl px-3 py-2.5"
        style={{ backgroundColor: orbit.surface, color: orbit.muted }}
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={enter}
      >
        <SearchIcon className="size-[18px]" />
        <input
          className="flex-1 bg-transparent text-[16px] outline-none placeholder:text-[inherit]"
          placeholder="Tasks, lists and notes"
        />
      </motion.label>
      <p
        className="mt-6 text-[13px] font-semibold uppercase tracking-wide"
        style={{ color: orbit.muted }}
      >
        Recent
      </p>
      {tasks.slice(0, 3).map((t, i) => (
        <motion.p
          key={t.id}
          className="border-b py-3 text-[16px]"
          style={{ borderColor: orbit.line }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...enter, delay: 0.05 + i * 0.04 }}
        >
          {t.title}
        </motion.p>
      ))}
    </div>
  )
}
