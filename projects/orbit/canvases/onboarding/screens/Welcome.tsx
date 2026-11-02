import { motion } from 'motion/react'
import { defineScreen, spring, useFlow, useMotion, usePlayback } from '@/runtime'
import { orbit, PrimaryButton } from '../../../shared/ui'

export default defineScreen({
  name: 'Welcome',
  motion: {
    enter: spring(0.6, 0.2),
    press: spring(0.25, 0.4),
  },
  variants: {
    bouncy: { name: 'Bouncy', motion: { enter: spring(0.8, 0.5) } },
  },
  component: Welcome,
})

function Welcome() {
  const enter = useMotion('enter')
  const press = useMotion('press')
  const { playing } = usePlayback()
  const { navigate } = useFlow()

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
        Make room
        <br />
        for focus
      </motion.h1>
      <motion.p
        className="mt-3 text-[16px] leading-snug"
        style={{ color: orbit.muted }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...enter, delay: 0.08 }}
      >
        Organize your work,
        <br />
        clear your mind.
      </motion.p>

      <div className="relative flex flex-1 items-center justify-center">
        <motion.div
          className="relative size-56"
          animate={playing ? { rotate: 360 } : { rotate: 0 }}
          transition={
            playing ? { repeat: Infinity, duration: 14, ease: 'linear' } : { duration: 0 }
          }
        >
          <svg viewBox="0 0 224 224" className="absolute inset-0" aria-hidden>
            <ellipse
              cx="112"
              cy="112"
              rx="96"
              ry="56"
              fill="none"
              stroke={orbit.accent}
              strokeOpacity="0.35"
              strokeWidth="1.5"
              transform="rotate(-24 112 112)"
            />
          </svg>
          <motion.span
            className="absolute left-[26px] top-[118px] size-16 rounded-full"
            style={{
              background: `radial-gradient(circle at 35% 30%, #d9d0ff, ${orbit.accent})`,
            }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ ...enter, delay: 0.15 }}
          />
          <motion.span
            className="absolute right-[34px] top-[38px] size-11 rounded-full"
            style={{ background: `radial-gradient(circle at 35% 30%, #ece7ff, #a996ff)` }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ ...enter, delay: 0.25 }}
          />
        </motion.div>
      </div>

      <Dots active={0} />
      <div className="mt-6">
        <PrimaryButton onClick={() => navigate()} transition={press}>
          Continue
        </PrimaryButton>
      </div>
    </div>
  )
}

export function Dots({ active }: { active: number }) {
  return (
    <div className="flex justify-center gap-1.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="size-1.5 rounded-full"
          style={{ backgroundColor: i === active ? orbit.accent : '#d8d8e2' }}
        />
      ))}
    </div>
  )
}
