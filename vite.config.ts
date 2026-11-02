import { existsSync, readdirSync } from 'node:fs'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import { physical, rootRoute } from '@tanstack/virtual-file-routes'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { springboard } from './vite/springboard-plugin.ts'

// Each project with an app/ folder is mounted as a mini app at /<project>.
const projects = readdirSync('projects').filter((p) => existsSync(`projects/${p}/app`))

export default defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
      routesDirectory: './src/routes',
      virtualRouteConfig: rootRoute('__root.tsx', [
        physical('', 'host'),
        ...projects.map((p) => physical(`/${p}`, `../../projects/${p}/app`)),
      ]),
    }),
    react(),
    tailwindcss(),
    springboard(),
  ],
  server: { port: 3000 },
})
