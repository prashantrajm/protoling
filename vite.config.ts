import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import { physical, rootRoute } from '@tanstack/virtual-file-routes'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { discoverProjects } from './vite/projects.ts'
import { springboard } from './vite/springboard-plugin.ts'

const projects = discoverProjects(process.cwd())

export default defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
      routesDirectory: './src/routes',
      // Springboard's own pages live in src/routes/host. Each project's
      // app/ folder is plain TanStack file routes, mounted at /<project>.
      virtualRouteConfig: rootRoute('__root.tsx', [
        physical('', 'host'),
        ...projects.map((p) => physical(`/${p}`, `../../projects/${p}/app`)),
      ]),
    }),
    react(),
    tailwindcss(),
    springboard({ projects }),
  ],
  server: { port: 3000 },
})
