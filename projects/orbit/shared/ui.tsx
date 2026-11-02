import { CalendarCheck, Inbox, Search, User } from 'lucide-react'
import { motion, type Transition } from 'motion/react'

/**
 * Orbit's own design system. Prototype colours are independent of
 * Protoling's UI, so this violet is Orbit's, not the platform accent.
 */
export const orbit = {
  accent: '#7b61ff',
  accentSoft: '#efeaff',
  ink: '#16161d',
  muted: '#8a8a99',
  line: '#ececf2',
  surface: '#f6f6fa',
}

export interface Task {
  id: string
  title: string
  list: 'focus' | 'personal'
  done: boolean
}

export const tasks: Task[] = [
  { id: 'feedback', title: 'Review design feedback', list: 'focus', done: true },
  { id: 'sprint', title: 'Plan sprint', list: 'focus', done: false },
  { id: 'docs', title: 'Update documentation', list: 'focus', done: false },
  { id: 'onboarding', title: 'Design onboarding', list: 'focus', done: false },
  { id: 'testing', title: 'Prepare for user testing', list: 'personal', done: true },
  { id: 'gym', title: 'Gym', list: 'personal', done: true },
]

export function ProgressRing({
  done,
  total,
  transition,
}: {
  done: number
  total: number
  transition: Transition
}) {
  const radius = 17
  const circumference = 2 * Math.PI * radius
  const progress = total === 0 ? 0 : done / total
  return (
    <div className="relative grid size-11 place-items-center">
      <svg viewBox="0 0 44 44" className="absolute inset-0 -rotate-90" aria-hidden>
        <circle
          cx="22"
          cy="22"
          r={radius}
          fill="none"
          stroke={orbit.line}
          strokeWidth="3.5"
        />
        <motion.circle
          cx="22"
          cy="22"
          r={radius}
          fill="none"
          stroke={orbit.accent}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - progress) }}
          transition={transition}
        />
      </svg>
      <span
        className="text-[11px] font-semibold tabular-nums"
        style={{ color: orbit.accent }}
      >
        {done}/{total}
      </span>
    </div>
  )
}

export function Checkbox({
  checked,
  transition,
}: {
  checked: boolean
  transition: Transition
}) {
  return (
    <motion.span
      className="grid size-[22px] shrink-0 place-items-center rounded-full border-2"
      animate={{
        backgroundColor: checked ? orbit.accent : '#ffffff',
        borderColor: checked ? orbit.accent : '#cfcfdb',
      }}
      transition={transition}
    >
      <motion.svg viewBox="0 0 16 16" className="size-3" fill="none" aria-hidden>
        <motion.path
          d="M3.5 8.5l3 3 6-6.5"
          stroke="#fff"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={false}
          animate={{ pathLength: checked ? 1 : 0 }}
          transition={transition}
        />
      </motion.svg>
    </motion.span>
  )
}

export const tabItems = [
  { id: 'today', label: 'Today', icon: CalendarCheck },
  { id: 'search', label: 'Search', icon: Search },
  { id: 'inbox', label: 'Inbox', icon: Inbox },
  { id: 'me', label: 'Me', icon: User },
] as const

export type TabId = (typeof tabItems)[number]['id']

export function TabBar({
  active,
  onSelect,
}: {
  active: TabId | undefined
  onSelect: (id: TabId) => void
}) {
  return (
    <nav
      aria-label="Tab bar"
      className="relative z-20 flex justify-around border-t bg-white/90 pt-2 backdrop-blur"
      style={{ borderColor: orbit.line, paddingBottom: 'max(var(--safe-bottom), 8px)' }}
    >
      {tabItems.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          aria-current={id === active ? 'page' : undefined}
          data-tab={id}
          onClick={() => onSelect(id)}
          className="flex w-16 flex-col items-center gap-1 text-[10px] font-medium"
          style={{ color: id === active ? orbit.accent : orbit.muted }}
        >
          <Icon className="size-[22px]" strokeWidth={id === active ? 2.2 : 1.8} />
          {label}
        </button>
      ))}
    </nav>
  )
}

export function PrimaryButton({
  children,
  onClick,
  transition,
}: {
  children: React.ReactNode
  onClick?: () => void
  transition: Transition
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      className="h-[52px] w-full rounded-2xl text-[17px] font-semibold text-white"
      style={{ backgroundColor: orbit.accent }}
      whileTap={{ scale: 0.96 }}
      transition={transition}
    >
      {children}
    </motion.button>
  )
}
