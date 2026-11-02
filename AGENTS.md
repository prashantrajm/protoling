# Working on Springboard prototypes

Springboard prototypes are small mobile apps written as React + TanStack Router file routes. You write them in code; the web UI is for playing them, comparing variants and handing motion off to engineers.

## Where things go

```
projects/<project>/
  project.json            { "name", "description", "device" }
  app/                    TanStack file routes, mounted at /<project>
    route.tsx             the app's root layout (required)
    index.tsx             usually a redirect to the first screen
    _tabs/route.tsx       a pathless layout, e.g. a tab bar
    _tabs/today/route.tsx a screen at /<project>/today
  boards/<name>.ts        optional: app states side by side
  shared/                 components and data the screens share
```

Folder names must be lowercase slugs. `p` is reserved. Adding or removing a project restarts the dev server automatically.

Look at `projects/orbit` for a complete example before writing a new project.

## A screen

A screen is a normal TanStack route with `staticData.screen`:

```tsx
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { motion } from 'motion/react'
import { StackScreen, spring, tween, useMotion } from '@/runtime'

export const Route = createFileRoute('/orbit/_tabs/today')({
  staticData: {
    screen: {
      name: 'Today',
      motion: { enter: spring(0.45, 0.15) }, // visualDuration (s), bounce
      variants: {
        'soft-spring': { name: 'Soft spring', motion: { enter: spring(0.7, 0.35) } },
      },
    },
  },
  component: Today,
})

function Today() {
  const enter = useMotion('enter')
  const navigate = useNavigate()
  return (
    <StackScreen>
      <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={enter}>Today</motion.h1>
      <button onClick={() => navigate({ to: '/orbit/today/detail', search: { task: 'a' } })}>Open</button>
    </StackScreen>
  )
}
```

The `createFileRoute('…')` path is filled in by the router generator. Paths include the project prefix (`/orbit/...`) and pathless segments like `/_tabs`.

## Navigation: native behaviour from plain routes

- **Push / sheet / full screen:** make the child a nested route and set `staticData.presentation: 'push' | 'sheet' | 'fullScreen'` plus `staticData.transition: spring(…)` on the child. The parent must render its content inside `<StackScreen>`. The parent stays mounted underneath.
- **Back / dismiss:** call `useDismiss()`. It animates out, then navigates. Never call `history.back()` for this: the screen can't animate after its route is gone.
- **Tabs:** a pathless layout route using `useTabs({ today: '/orbit/today', … })`; it remembers each tab's stack.
- **Links and params:** use TanStack's `Link`, `useNavigate`, `validateSearch`. Prefer search params over path params for screen state, so screens appear on the automatic **All screens** board.

## Motion

- Declare timings in `staticData.screen.motion` and read them with `useMotion(key)`. That is what makes replay, slow motion, variants and the SwiftUI/Compose handoff work. Literal transitions inside a component aren't exported or slowed down.
- Prefer springs (`spring(visualDuration, bounce)`) to tweens.
- `useVariant().id` lets a variant change structure, not only timing.
- Gate looping animations on `usePlayback().playing`.
- Motion springs take two keyframes only; don't pass keyframe arrays with a spring.

## Layout inside a phone

- Screens fill their container: use `h-full`, flex, and container units (`cqw`, `cqh`). Never use `vh`, `vw` or viewport media queries: on a board the "viewport" is a frame, not the window.
- Use `var(--safe-top)`, `var(--safe-bottom)` (and left/right) for insets.
- Prototype colours are independent of Springboard's theme. Don't use Springboard's CSS variables (`--brand`, `--background`, …) in a project.

## Check your work

Before saying a screen is done:

1. `bun run snap <project>/<path>` writes PNGs to `snaps/` (gitignored). Look at them. Use `--frames 6` to see an animation as a strip, `--device iphone-se` for a small phone. It exits non-zero if the page threw.
2. `bun run typecheck` and `bun run lint`.
3. Open `http://localhost:3000/p/<project>/play/<path>` and tap through the flow.

## Don't

- Don't build navigation by hand (state machines, conditional rendering of screens). Use routes.
- Don't edit `src/routeTree.gen.ts`; it's generated.
- Don't add a navigation library.
