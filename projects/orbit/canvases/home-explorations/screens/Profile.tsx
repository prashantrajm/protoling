import { Bell, Moon, Sparkles } from 'lucide-react'
import { animate, motion, useMotionValue, useTransform } from 'motion/react'
import { useEffect, useState } from 'react'
import { defineScreen, spring, tween, useMotion, usePlayback } from '@/runtime'
import { orbit, TabBar } from '../../../shared/ui'

export default defineScreen({
  name: 'Profile',
  motion: {
    enter: spring(0.5, 0.2),
    toggle: spring(0.3, 0.35),
    count: tween(1.2, 'easeOut'),
  },
  component: Profile,
})

function Profile() {
  const enter = useMotion('enter')

  return (
    <div
      className="flex h-full flex-col items-center bg-white"
      style={{ color: orbit.ink }}
    >
      <motion.div
        className="mt-[calc(var(--safe-top)+28px)] grid size-24 place-items-center rounded-full text-[32px] font-bold text-white"
        style={{ background: `linear-gradient(135deg, ${orbit.accent}, #b79bff)` }}
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={enter}
      >
        AM
      </motion.div>
      <motion.h1
        className="mt-4 text-[24px] font-bold tracking-tight"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...enter, delay: 0.06 }}
      >
        Alex Morgan
      </motion.h1>
      <p className="text-[15px]" style={{ color: orbit.muted }}>
        Product designer
      </p>

      <div className="mt-7 grid w-full grid-cols-3 px-5">
        <Stat label="Done" value={128} />
        <Stat label="Streak" value={12} />
        <Stat label="Focus hrs" value={46} />
      </div>

      <ul className="mt-8 w-full px-5">
        <Setting icon={Bell} label="Reminders" initial />
        <Setting icon={Moon} label="Quiet hours" initial={false} />
        <Setting icon={Sparkles} label="Smart lists" initial />
      </ul>

      <TabBar active="me" />
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  const count = useMotion('count')
  const { playing } = usePlayback()
  const motionValue = useMotionValue(0)
  const rounded = useTransform(motionValue, (v) => Math.round(v))

  useEffect(() => {
    if (!playing) {
      motionValue.set(value)
      return
    }
    const controls = animate(motionValue, value, count)
    return () => controls.stop()
  }, [count, motionValue, playing, value])

  return (
    <div className="text-center">
      <motion.p className="text-[26px] font-bold tabular-nums">{rounded}</motion.p>
      <p className="text-[12px] font-medium" style={{ color: orbit.muted }}>
        {label}
      </p>
    </div>
  )
}

function Setting({
  icon: Icon,
  label,
  initial,
}: {
  icon: typeof Bell
  label: string
  initial: boolean
}) {
  const toggle = useMotion('toggle')
  const [on, setOn] = useState(initial)
  return (
    <li
      className="flex items-center gap-3 border-b py-3.5"
      style={{ borderColor: orbit.line }}
    >
      <Icon className="size-5" style={{ color: orbit.accent }} />
      <span className="flex-1 text-[16px]">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={label}
        onClick={() => setOn(!on)}
        className="flex h-[31px] w-[51px] rounded-full p-[2px]"
        style={{
          backgroundColor: on ? orbit.accent : '#e3e3ea',
          justifyContent: on ? 'flex-end' : 'flex-start',
        }}
      >
        <motion.span
          layout
          transition={toggle}
          className="size-[27px] rounded-full bg-white shadow"
        />
      </button>
    </li>
  )
}
