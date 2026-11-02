import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { motion } from 'motion/react'
import { spring, useMotion } from '@/runtime'
import { orbit, PrimaryButton } from '../../shared/ui'

export const Route = createFileRoute('/orbit/welcome/progress')({
  staticData: {
    screen: {
      name: 'Progress',
      motion: {
        enter: spring(0.6, 0.2),
        bars: spring(0.7, 0.25),
        press: spring(0.25, 0.4),
      },
    },
    presentation: 'push',
    transition: spring(0.5, 0),
  },
  component: Progress,
})

const bars = [0.28, 0.42, 0.58, 0.76, 1]

function Progress() {
  const enter = useMotion('enter')
  const bar = useMotion('bars')
  const press = useMotion('press')
  const navigate = useNavigate()

  return (
    <div
      className="flex h-full flex-col bg-white px-6 pb-[calc(var(--safe-bottom)+16px)] pt-[calc(var(--safe-top)+12px)]"
      style={{ color: orbit.ink }}
    >
      <p className="text-[15px] font-semibold">Orbit</p>
      <motion.h1
        className="mt-6 text-[34px] font-bold leading-[1.1] tracking-tight"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={enter}
      >
        A little progress,
        <br />
        daily
      </motion.h1>
      <motion.p
        className="mt-3 text-[16px] leading-snug"
        style={{ color: orbit.muted }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...enter, delay: 0.08 }}
      >
        Small steps add up
        <br />
        to big results.
      </motion.p>

      <div className="flex flex-1 items-end justify-center gap-3 pb-10">
        {bars.map((height, i) => (
          <motion.span
            key={height}
            className="w-9 origin-bottom rounded-t-lg"
            style={{
              height: `${height * 180}px`,
              background: `linear-gradient(to top, ${orbit.accent}, #c9bcff)`,
              opacity: 0.35 + height * 0.65,
            }}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ ...bar, delay: 0.2 + i * 0.07 }}
          />
        ))}
      </div>

      <div className="flex justify-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="size-1.5 rounded-full"
            style={{ backgroundColor: i === 1 ? orbit.accent : '#d8d8e2' }}
          />
        ))}
      </div>
      <div className="mt-6">
        <PrimaryButton
          onClick={() => navigate({ to: '/orbit/today', replace: true })}
          transition={press}
        >
          Continue
        </PrimaryButton>
      </div>
    </div>
  )
}
