import { createFileRoute } from '@tanstack/react-router'
import { Inbox as InboxIcon } from 'lucide-react'
import { motion } from 'motion/react'
import { spring, useMotion } from '@/runtime'
import { orbit } from '../../shared/ui'

export const Route = createFileRoute('/orbit/_tabs/inbox')({
  staticData: {
    screen: { name: 'Inbox', motion: { enter: spring(0.6, 0.3) } },
  },
  component: Inbox,
})

function Inbox() {
  const enter = useMotion('enter')
  return (
    <div
      className="flex h-full flex-col bg-white px-5 pt-[calc(var(--safe-top)+20px)]"
      style={{ color: orbit.ink }}
    >
      <h1 className="text-[34px] font-bold tracking-tight">Inbox</h1>
      <div className="flex flex-1 flex-col items-center justify-center pb-20 text-center">
        <motion.div
          className="grid size-20 place-items-center rounded-3xl"
          style={{ backgroundColor: orbit.accentSoft, color: orbit.accent }}
          initial={{ scale: 0.5, opacity: 0, rotate: -12 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={enter}
        >
          <InboxIcon className="size-9" />
        </motion.div>
        <p className="mt-4 text-[17px] font-semibold">Inbox zero</p>
        <p className="mt-1 text-[15px]" style={{ color: orbit.muted }}>
          New tasks you capture land here.
        </p>
      </div>
    </div>
  )
}
