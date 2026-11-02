import {
  AnimatePresence,
  animate,
  type MotionValue,
  motion,
  useMotionValue,
  useTransform,
} from 'motion/react'
import { useEffect, useState } from 'react'

// Shown once per browser session, on the host only (never in a mini app,
// a preview link or a share build). Skipped for automation (`snap`) and
// reduced motion. Any click or key skips it.
const SEEN_KEY = 'protoling:boot-splash'
const HOLD_MS = 2400
const BRAND = '#4a48f4'

function shouldShow() {
  if (typeof window === 'undefined') return false
  if (navigator.webdriver) return false
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false
  try {
    return sessionStorage.getItem(SEEN_KEY) !== '1'
  } catch {
    return true
  }
}

export function BootSplash() {
  const [open, setOpen] = useState(shouldShow)

  useEffect(() => {
    if (!open) return
    try {
      sessionStorage.setItem(SEEN_KEY, '1')
    } catch {}
    const close = () => setOpen(false)
    const timer = window.setTimeout(close, HOLD_MS)
    window.addEventListener('keydown', close)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('keydown', close)
    }
  }, [open])

  return (
    <AnimatePresence>
      {open && <Splash key="boot-splash" onSkip={() => setOpen(false)} />}
    </AnimatePresence>
  )
}

function Splash({ onSkip }: { onSkip: () => void }) {
  const [{ w, h }] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }))
  // 0 → 1 as the cursor flies from beyond the bottom-right corner to the
  // centre. Everything else (the brand colour spreading, tilt, scale) follows it.
  const progress = useMotionValue(0)
  useEffect(() => {
    const controls = animate(progress, 1, {
      duration: 1.2,
      ease: [0.55, 0, 0.2, 1],
    })
    return () => controls.stop()
  }, [progress])

  const startX = w / 2 + 160
  const startY = h / 2 + 160
  const x = useTransform(progress, (p) => startX * (1 - p))
  // A slight upward arc rather than a straight line.
  const y = useTransform(progress, (p) => startY * (1 - p) - Math.sin(Math.PI * p) * 70)
  const rotate = useTransform(progress, [0, 1], [10, 0])
  const scale = useTransform(progress, [0, 1], [0.7, 1])

  return (
    <motion.div
      aria-hidden
      onPointerDown={onSkip}
      className="fixed inset-0 z-[1000] overflow-hidden bg-background"
      exit={{ opacity: 0, transition: { duration: 0.4, delay: 0.2, ease: 'easeOut' } }}
    >
      <style>{SPLASH_CSS}</style>
      <BrandFill progress={progress} x={x} y={y} w={w} h={h} />

      <div className="absolute left-1/2 top-1/2">
        <motion.div style={{ x, y, rotate, scale }}>
          <motion.div
            // Keeps flying the way it points (up and to the left) on exit.
            exit={{ x: -(w / 2 + 260), y: -(h / 2 + 220), scale: 0.7 }}
            transition={{ type: 'spring', visualDuration: 0.5, bounce: 0 }}
            className="-translate-x-1/2 -translate-y-1/2"
          >
            <div className="boot-glow" />
            <div className="boot-bob">
              <FlyingCursor />
            </div>
          </motion.div>
        </motion.div>
      </div>

      <motion.span
        className="absolute left-1/2 top-1/2 -translate-x-1/2 translate-y-[134px] text-[22px] font-semibold tracking-tight text-white"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, transition: { duration: 0.15 } }}
        transition={{ type: 'spring', visualDuration: 0.45, bounce: 0, delay: 1.05 }}
      >
        Protoling
      </motion.span>
    </motion.div>
  )
}

// The brand colour travels in with the cursor: a circle centred on it that
// grows from a halo to the whole screen as it reaches the middle.
function BrandFill({
  progress,
  x,
  y,
  w,
  h,
}: {
  progress: MotionValue<number>
  x: MotionValue<number>
  y: MotionValue<number>
  w: number
  h: number
}) {
  const diagonal = Math.hypot(w, h)
  const clipPath = useTransform(() => {
    const p = Math.max(0, progress.get())
    const r = 110 + p ** 1.3 * diagonal * 0.62
    return `circle(${r}px at ${w / 2 + x.get()}px ${h / 2 + y.get()}px)`
  })
  return (
    <motion.div
      className="absolute inset-0"
      style={{
        clipPath,
        background: `radial-gradient(120% 90% at 35% 30%, #6563ff 0%, ${BRAND} 45%, #3a37d6 100%)`,
      }}
    />
  )
}

// A detailed take on public/favicon.svg, after the 3D app icon: a white body
// with depth, soft shading from the wing and the tail notch, and three
// translucent wings. The wings share a root near (460, 630) in icon space and
// each flaps about it, the back ones lagging.
const BODY = 'M218 362 L600 450 L912 850 L828 924 L800 1022 L602 918 L422 998 Z'
const WING_FRONT =
  'M450 628 C560 470 762 222 930 190 C986 180 992 250 974 300 C930 430 870 580 800 672 C760 705 700 702 640 688 C580 672 510 650 450 628 Z'
const WING_FOLD =
  'M450 628 C620 596 780 566 884 500 C856 580 830 636 800 672 C760 705 700 702 640 688 C580 672 510 650 450 628 Z'
const WING_MID =
  'M470 632 C640 500 862 330 1040 292 C1092 281 1102 332 1090 372 C1052 502 952 642 830 700 Z'
const WING_BACK =
  'M482 636 C690 540 930 412 1100 394 C1152 389 1152 442 1136 482 C1082 602 972 690 842 716 Z'

function FlyingCursor() {
  return (
    <svg viewBox="150 130 1060 960" width={256} height={232} className="overflow-visible">
      <title>Protoling</title>
      <defs>
        <linearGradient id="bs-body" x1="0.1" y1="0.05" x2="0.9" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.6" stopColor="#fbf9ff" />
          <stop offset="1" stopColor="#ebe4ff" />
        </linearGradient>
        <linearGradient id="bs-edge" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#dcd2fe" />
          <stop offset="1" stopColor="#9b8bf0" />
        </linearGradient>
        <radialGradient
          id="bs-notch"
          cx="610"
          cy="990"
          r="300"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#ad9bfa" stopOpacity="0.95" />
          <stop offset="0.45" stopColor="#c9bcfd" stopOpacity="0.55" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <linearGradient
          id="bs-front"
          x1="960"
          y1="190"
          x2="470"
          y2="650"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#e6deff" />
          <stop offset="0.45" stopColor="#bbacfb" />
          <stop offset="1" stopColor="#9886f8" />
        </linearGradient>
        <linearGradient
          id="bs-fold"
          x1="880"
          y1="520"
          x2="470"
          y2="640"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#9a86ff" />
          <stop offset="0.6" stopColor="#6d58ff" />
          <stop offset="1" stopColor="#5a45f6" />
        </linearGradient>
        <linearGradient
          id="bs-mid"
          x1="1080"
          y1="300"
          x2="480"
          y2="650"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#c9c6ff" />
          <stop offset="1" stopColor="#8784fb" />
        </linearGradient>
        <linearGradient
          id="bs-back"
          x1="1130"
          y1="420"
          x2="520"
          y2="660"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#ffd28f" />
          <stop offset="0.4" stopColor="#f8a7b6" />
          <stop offset="1" stopColor="#b5a1ff" />
        </linearGradient>
        <filter id="bs-shadow" x="-30%" y="-30%" width="160%" height="170%">
          <feDropShadow
            dx="0"
            dy="40"
            stdDeviation="36"
            floodColor="#140f6e"
            floodOpacity="0.45"
          />
        </filter>
        <filter id="bs-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="26" />
        </filter>
        <mask id="bs-body-mask">
          <path
            d={BODY}
            fill="#fff"
            stroke="#fff"
            strokeWidth={92}
            strokeLinejoin="round"
          />
        </mask>
        <clipPath id="bs-front-clip">
          <path d={WING_FRONT} />
        </clipPath>
      </defs>

      <g filter="url(#bs-shadow)">
        {/* Back wings, behind the body. */}
        <g className="boot-wing boot-wing-3">
          <path d={WING_BACK} fill="url(#bs-back)" opacity={0.92} />
          <path
            d="M500 628 C700 540 930 412 1100 394 C1140 390 1146 425 1140 460"
            fill="none"
            stroke="#fff"
            strokeOpacity={0.45}
            strokeWidth={7}
            strokeLinecap="round"
          />
        </g>
        <g className="boot-wing boot-wing-2">
          <path d={WING_MID} fill="url(#bs-mid)" opacity={0.9} />
          <path
            d="M490 618 C650 500 862 330 1040 292 C1080 284 1096 310 1094 345"
            fill="none"
            stroke="#fff"
            strokeOpacity={0.5}
            strokeWidth={7}
            strokeLinecap="round"
          />
        </g>

        {/* Body: an extruded side, then the face with its shading. */}
        <path
          d={BODY}
          transform="translate(8 30)"
          fill="url(#bs-edge)"
          stroke="url(#bs-edge)"
          strokeWidth={92}
          strokeLinejoin="round"
        />
        <path
          d={BODY}
          fill="url(#bs-body)"
          stroke="url(#bs-body)"
          strokeWidth={92}
          strokeLinejoin="round"
        />
        <g mask="url(#bs-body-mask)">
          <rect x="300" y="700" width="700" height="400" fill="url(#bs-notch)" />
          <ellipse
            cx="660"
            cy="700"
            rx="250"
            ry="70"
            transform="rotate(16 660 700)"
            fill="#9d8df6"
            opacity={0.55}
            filter="url(#bs-blur)"
          />
          <ellipse
            cx="300"
            cy="420"
            rx="120"
            ry="60"
            transform="rotate(14 300 420)"
            fill="#fff"
            filter="url(#bs-blur)"
          />
        </g>

        {/* Eyes, with a glint. */}
        <g className="boot-blink">
          <g transform="rotate(32 322 444)">
            <rect x="300" y="404" width="44" height="80" rx="22" fill="#211d2e" />
            <ellipse cx="315" cy="424" rx="7" ry="12" fill="#fff" opacity={0.75} />
          </g>
          <g transform="rotate(32 386 481)">
            <rect x="366" y="446" width="40" height="70" rx="20" fill="#211d2e" />
            <ellipse cx="380" cy="464" rx="6" ry="10" fill="#fff" opacity={0.75} />
          </g>
        </g>

        {/* Front wing, over the body. */}
        <g className="boot-wing boot-wing-1">
          <path d={WING_FRONT} fill="url(#bs-front)" opacity={0.97} />
          <g clipPath="url(#bs-front-clip)">
            <ellipse
              cx="840"
              cy="320"
              rx="150"
              ry="70"
              transform="rotate(-40 840 320)"
              fill="#fff"
              opacity={0.45}
              filter="url(#bs-blur)"
            />
          </g>
          <path d={WING_FOLD} fill="url(#bs-fold)" />
          <path
            d="M450 628 C620 596 780 566 884 500"
            fill="none"
            stroke="#c9bcff"
            strokeOpacity={0.7}
            strokeWidth={5}
            strokeLinecap="round"
          />
          <path
            d="M456 620 C560 470 762 222 930 190 C980 181 990 240 976 292"
            fill="none"
            stroke="#fff"
            strokeOpacity={0.8}
            strokeWidth={8}
            strokeLinecap="round"
          />
        </g>
      </g>
    </svg>
  )
}

const SPLASH_CSS = `
.boot-wing {
  transform-box: view-box;
  transform-origin: 460px 630px;
  animation: boot-flap 0.32s ease-in-out infinite alternate;
}
.boot-wing-2 { animation-delay: -0.58s; }
.boot-wing-3 { animation-delay: -0.52s; }
@keyframes boot-flap {
  from { transform: rotate(-10deg) scale(1.02); }
  to { transform: rotate(26deg) scale(0.9, 0.78); }
}
.boot-bob { animation: boot-bob 0.64s ease-in-out infinite; }
@keyframes boot-bob {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-7px); }
}
.boot-glow {
  position: absolute;
  inset: -40%;
  background: radial-gradient(closest-side, rgb(255 255 255 / 0.28), transparent);
  pointer-events: none;
}
.boot-blink {
  transform-box: view-box;
  transform-origin: 354px 462px;
  animation: boot-blink 1.4s ease-in-out 0.9s both;
}
@keyframes boot-blink {
  0%, 44%, 56%, 100% { transform: scaleY(1); }
  50% { transform: scaleY(0.1); }
}
`
