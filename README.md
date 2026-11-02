# Springboard

**Prototype mobile app interactions and animations in code.**

Springboard is an open-source starter for designing how a mobile app _moves_. You write screens as React components and animate them with [Motion](https://motion.dev). Springboard shows them on a canvas at real device sizes, lets you compare animation variants side by side, plays them as connected flows, opens them full screen on your phone, and turns every timing into code for SwiftUI and Jetpack Compose.

> **Status:** early development. Expect breaking changes.

---

## Why Springboard

Once the static design is done, the hardest part is still ahead: defining how the app moves. Figma and similar tools make realistic interactions slow to build. Code is fast to build and refine, especially with AI coding tools.

The goal is **clear communication between design and engineering**. Instead of describing motion in documents, show mobile developers exactly how an interaction looks and feels, with the values they need to rebuild it natively.

## How it works

Springboard is **code-first**. Clone it, then write your prototypes as files in `projects/`. The web UI is for looking at your work: browsing, comparing, playing and handing off. Everything that defines a prototype lives in code you can review in a pull request.

It runs entirely on your machine. There's no hosted version, no account and no database.

## Getting started

Requires [Bun](https://bun.sh) 1.2 or later.

```bash
git clone <repository-url> my-prototypes
cd my-prototypes
bun install
bun run dev
```

Open [http://localhost:3000](http://localhost:3000). The bundled **Orbit** project shows what's possible. Keep it as a reference or delete `projects/orbit` once you've added your own.

### Preview on your phone

```bash
bun run dev:phone
```

This makes the dev server reachable on your local network. Click **Open on phone** and scan the QR code. The prototype fills the screen with no controls:

- **Three-finger tap** shows a menu for switching variants and exiting. Tap again to hide it.
- With a keyboard, **⌘ .** (or **Ctrl .**) toggles the menu, and **Esc** closes it, then exits.

Editing only works from the computer running Springboard. A phone on the network can view prototypes but can't change files.

## Writing prototypes

### Folder layout

```
projects/
  my-app/
    project.json               { "name": "My app", "description": "…" }
    canvases/
      checkout/
        canvas.json            device, frames, connectors
        screens/
          Cart.tsx             one screen per file
          Payment.tsx
    shared/                    anything you want to import from screens
```

Add a folder or file and the UI picks it up straight away; there's nothing to register.

### A screen

```tsx
// projects/my-app/canvases/checkout/screens/Cart.tsx
import { motion } from 'motion/react'
import { defineScreen, spring, tween, useFlow, useMotion } from '@/runtime'

export default defineScreen({
  name: 'Cart',
  motion: {
    enter: spring(0.45, 0.15), // visualDuration in seconds, bounce
    press: spring(0.2, 0.3),
  },
  variants: {
    'soft-spring': { name: 'Soft spring', motion: { enter: spring(0.7, 0.35) } },
    'quick-fade': { name: 'Quick fade', motion: { enter: tween(0.18, 'easeOut') } },
  },
  component: Cart,
})

function Cart() {
  const enter = useMotion('enter')
  const press = useMotion('press')
  const { navigate } = useFlow()

  return (
    <div className="flex h-full flex-col bg-white pt-[var(--safe-top)]">
      <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={enter}>
        Cart
      </motion.h1>
      <motion.button whileTap={{ scale: 0.96 }} transition={press} onClick={() => navigate('payment')}>
        Checkout
      </motion.button>
    </div>
  )
}
```

- **Motion tokens** are named timings. Read them with `useMotion(key)`, which returns a ready-made Motion `transition`. The inspector graphs every token and exports it as code.
- **Variants** override tokens. The first variant is always the defaults. Switch between them on the canvas, in focus mode or on the phone, and `useVariant().id` lets a variant change structure as well as timing.
- Prefer springs defined by `visualDuration` and `bounce`; they map directly onto SwiftUI's `.spring(duration:bounce:)`.

### Runtime API

Everything a screen needs comes from `@/runtime`:

| Export | Purpose |
| --- | --- |
| `defineScreen({ name, motion, variants?, statusBar?, component })` | Declares a screen. Default-export the result. |
| `spring(visualDuration, bounce)`, `tween(duration, ease)` | Create motion tokens. |
| `useMotion(key)` | The token's Motion `transition`, with the active variant and slow motion applied. |
| `useVariant()` | `{ id, name, index }` of the active variant. |
| `useFlow()` | `navigate(target?, params?)`, `back()`, `canGoBack`, `params`. |
| `useDevice()` | Device size, safe areas, platform and where the screen is shown. |
| `usePlayback()` | `{ playing, timeScale }`. Gate looping animations on `playing`. |

### Layout inside a frame

A screen on the canvas is a 402 px box inside a desktop window, so `100vh` and media queries would read the browser window, not the phone. Inside a screen:

- Use `h-full` / `w-full`, or container units (`cqw`, `cqh`) and container queries. Every frame is a size container.
- Use the `--safe-top`, `--safe-bottom`, `--safe-left` and `--safe-right` CSS variables for insets. They match the device on the canvas and use the real `env(safe-area-inset-*)` on a phone.
- `position: fixed` is contained by the frame, so tab bars and sheets stay inside it.

Focus mode renders the screen in an iframe at exact device size, so viewport units and scrolling behave exactly as on a phone.

### Canvases and flows

`canvas.json` places screens and links them:

```json
{
  "name": "Checkout",
  "device": "iphone-17-pro",
  "frames": [
    { "id": "cart", "screen": "Cart", "position": { "x": 0, "y": 0 } },
    { "id": "payment", "screen": "Payment", "position": { "x": 520, "y": 0 } }
  ],
  "connectors": [
    {
      "id": "cart-payment",
      "from": "cart",
      "to": "payment",
      "label": "Checkout",
      "animation": "push",
      "transition": { "type": "spring", "visualDuration": 0.45, "bounce": 0 }
    }
  ]
}
```

- `navigate('payment')` goes to a frame by id or screen name. `navigate()` with no target follows the first connector leaving the frame. Params passed as a second argument arrive in `useFlow().params`.
- Connector `animation` is `push`, `modal`, `fade` or `none`. It plays forwards on `navigate` and in reverse on `back`.
- In focus mode and on the phone, screens share one layout scope, so a `layoutId` on both screens animates between them.
- Devices: `iphone-17-pro`, `iphone-17-pro-max`, `iphone-air`, `iphone-16`, `iphone-15-pro`, `iphone-15-pro-max`, `iphone-se`, `pixel-8`. Set one per canvas, or per frame with `"device"`.
- `"preview": ["cart", "payment"]` picks which frames play in the project page's thumbnail.

Dragging a frame by its label saves the new position to `canvas.json`.

## Using the app

| Surface | What it's for |
| --- | --- |
| **Project home** | Every canvas with real rendered screens. Hover a card to play its preview. |
| **Canvas** | All screens at real size. Screens stay interactive; tapping through a flow highlights the connector and moves to the next screen. |
| **Inspector** | The selected screen's variants, each motion token's curve and physics, and handoff code for Motion, SwiftUI and Compose. |
| **Focus** | One screen in an exact-size iframe, playable as a flow. |
| **Phone** | The prototype full screen on a real device. |

### Shortcuts

| Key | Action |
| --- | --- |
| ⌘K | Command palette: jump to any screen, switch theme |
| R | Replay animations |
| S | Slow motion (4× slower) |
| 1–9 | Switch variant of the selected screen |
| F | Focus the selected screen |
| I | Toggle the inspector |
| Shift 1 | Fit the canvas to the screen |
| ← → | Previous / next screen in focus mode |
| Esc | Deselect, or leave focus mode |

Slow motion applies to timings that come from `useMotion()` and connectors. Transitions written as literals inside a screen run at normal speed.

## Handoff

The inspector computes native values from the same physics Motion runs, and unit tests check them against Motion's own spring generator.

For a spring with `visualDuration` _d_ and `bounce` _b_ (mass 1):

| Platform | Code |
| --- | --- |
| SwiftUI | `.spring(duration: 1.2 × d, bounce: b)`. For negative bounce it exports exact `.interpolatingSpring(mass:stiffness:damping:)` instead, since the two libraries shape overdamped springs differently. |
| Jetpack Compose | `spring(dampingRatio = 1 − b, stiffness = (2π / 1.2d)²)` for bounce ≥ 0. Negative bounce exports the exact damping ratio and stiffness Motion uses. |

Tweens export as cubic Béziers. Motion's `circ`, `backInOut` and `anticipate` easings aren't Béziers, so those are exported as the closest curve and flagged as approximate.

## Scripts

| Command | Description |
| --- | --- |
| `bun run dev` | Start Springboard at localhost:3000 |
| `bun run dev:phone` | Same, reachable from other devices on your network |
| `bun run build` | Typecheck and build a static, read-only copy of every project |
| `bun run preview` | Serve that build locally |
| `bun run test` | Run the tests (Vitest) |
| `bun run lint` | Lint and check formatting (Biome) |
| `bun run format` | Fix formatting |

## Tech stack

[Vite](https://vite.dev) with [TanStack Router](https://tanstack.com/router), [React 19](https://react.dev), [Motion](https://motion.dev), [React Flow](https://reactflow.dev), [Tailwind CSS v4](https://tailwindcss.com) and [shadcn/ui](https://ui.shadcn.com), [Zustand](https://zustand.docs.pmnd.rs), [Shiki](https://shiki.style), [cmdk](https://cmdk.paco.me), [Biome](https://biomejs.dev), [Vitest](https://vitest.dev) and [Bun](https://bun.sh).

## Project structure

```
projects/              your prototypes (Orbit is the example)
src/
  runtime/             the API screens import from @/runtime
  lib/                 schema, devices, motion maths, handoff, workspace store
  components/          canvas, inspector, previews, shell, ui (shadcn)
  routes/              file-based routes
vite/                  dev-server plugin: saves canvas.json, edit times, LAN URL
```

## Contributing

Contributions are welcome. Open an issue to discuss a bug or an idea, or send a pull request.

1. Fork the repository and create a branch from `main`.
2. Make your change. Check that `bun run lint`, `bun run test` and `bun run build` pass.
3. Open a pull request describing what changed and why.
