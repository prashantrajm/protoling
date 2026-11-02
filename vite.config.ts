import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import { physical, rootRoute } from '@tanstack/virtual-file-routes'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import settings from './protoling.config.ts'
import { type BuildMode, resolveShare } from './vite/config.ts'
import { discoverProjects } from './vite/projects.ts'
import { protoling } from './vite/protoling-plugin.ts'

// `bun run build:share` sets PROTOLING_MODE=share: only the chosen projects,
// and none of Protoling's own pages.
const mode: BuildMode = process.env.PROTOLING_MODE === 'share' ? 'share' : 'full'
const discovered = discoverProjects(process.cwd())
const share = mode === 'share' ? resolveShare(settings, discovered) : null
const projects = share?.projects ?? discovered

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    // A share build has its own route tree, so the committed one isn't touched.
    alias: share
      ? [
          {
            find: /^@\/routeTree\.gen$/,
            replacement: path.resolve('src/routeTree.share.gen.ts'),
          },
        ]
      : [],
  },
  plugins: [
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
      routesDirectory: './src/routes',
      generatedRouteTree: share
        ? './src/routeTree.share.gen.ts'
        : './src/routeTree.gen.ts',
      // Protoling's own pages live in src/routes/host. Each project's
      // app/ folder is plain TanStack file routes, mounted at /<project>.
      virtualRouteConfig: rootRoute('__root.tsx', [
        ...(share ? [] : [physical('', 'host')]),
        ...projects.map((p) => physical(`/${p}`, `../../projects/${p}/app`)),
      ]),
    }),
    react(),
    tailwindcss(),
    protoling({ mode, projects, start: share?.start ?? `/${projects[0] ?? ''}` }),
  ],
  server: { port: 3000 },
})
