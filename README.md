# Springboard

**Prototype mobile app interactions and animations in code.**

Springboard is an open-source tool for designing how a mobile app _moves_. It gives you a canvas of mobile screens, built as React components and shown at real device dimensions, where you can build, compare and share screen transitions, gestures, sheets and micro-interactions. Then you hand engineering the exact values they need to rebuild them natively.

> **Status:** early development. Expect rough edges and breaking changes.

---

## Why Springboard

Once the static design is done (every screen designed, the design system built in Figma), the hardest part is still ahead: defining how the app moves.

Figma and similar tools make realistic interactions slow and limiting to build. Code is faster to build and refine, especially with AI coding tools. Springboard is built on that idea: prototype motion in code, at true device size, and communicate it clearly.

The goal is **clear communication between design and engineering**. Instead of describing motion in documents or static mockups, designers can show mobile developers exactly how an interaction should look and feel, along with the values needed to rebuild it natively.

## Features

- **Real device dimensions:** screens render at real device sizes such as iPhone 17 Pro or iPhone 15 Pro, and keep their true mobile proportions on any display, from a 14-inch laptop to an external monitor.
- **Screens as React components:** every screen is plain React, so it lives in your codebase and works with your existing tooling.
- **Native-feeling motion:** animate with [Motion](https://motion.dev) and other web animation libraries to recreate screen transitions, gestures, sheets and micro-interactions.
- **Animation variants:** give a screen several variants, such as a soft spring and a quick fade, and compare them side by side before picking one.
- **Flows:** link screens into flows that show how a user moves through the app.
- **Focused preview:** view one screen or flow at a time, without the rest of the canvas.
- **On-device preview:** open a prototype full screen on a real phone to judge how it feels to the touch.
- **Handoff values:** share the durations, easing curves and spring parameters behind each interaction, so engineers can rebuild it natively.

## Local-first, by design

Springboard is fully open source and runs locally. There is **no hosted version, no account and no database**. Clone the repository, run it on your own machine, and keep your projects in your own codebase, versioned with the rest of your work.

## Getting started

### Requirements

- [Node.js](https://nodejs.org) 22 or later
- npm (bundled with Node.js)

### Install and run

```bash
git clone <repository-url> springboard
cd springboard
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

### Preview on a real phone

To try a prototype on your phone, connect it to the same network as your computer, run the dev server with `npm run dev -- --host`, and open the network URL Vite prints (for example `http://192.168.1.20:3000`) in your phone's browser.

## Scripts

| Command           | Description                              |
| ----------------- | ---------------------------------------- |
| `npm run dev`     | Start the dev server on port 3000        |
| `npm run build`   | Build for production                     |
| `npm run preview` | Preview the production build locally     |

## Tech stack

- [TanStack Start](https://tanstack.com/start) with [TanStack Router](https://tanstack.com/router) for file-based routing
- [React 19](https://react.dev)
- [Vite](https://vite.dev)
- [Tailwind CSS v4](https://tailwindcss.com), set up through the official `@tailwindcss/vite` plugin
- [TypeScript](https://www.typescriptlang.org)

## Project structure

```
src/
├── routes/          # File-based routes (TanStack Router)
│   ├── __root.tsx   # Root document: <html>, head tags, global styles
│   └── index.tsx    # Home route
├── router.tsx       # Router setup
└── styles.css       # Global styles and Tailwind entry (@import "tailwindcss")
```

Add a route by creating a file in `src/routes/`. The route tree is generated automatically.

### Styling

Tailwind v4 is configured in CSS, not JavaScript: there is no `tailwind.config.js`. To add design tokens such as colors, fonts and spacing, use `@theme` in `src/styles.css`:

```css
@import "tailwindcss";

@theme {
  --color-brand: oklch(0.65 0.2 250);
  --font-display: "Inter", sans-serif;
}
```

## Contributing

Contributions are welcome. Open an issue to discuss a bug or an idea, or send a pull request.

1. Fork the repository and create a branch from `main`.
2. Make your change and check that `npm run build` passes.
3. Open a pull request with a clear description of what changed and why.
