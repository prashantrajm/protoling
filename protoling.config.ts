import { defineConfig } from './vite/config.ts'

/**
 * Build settings. See "Sharing a prototype" in the README.
 *
 * `bun run build:share` builds only the prototypes listed here, with none of
 * Protoling's tooling, ready to deploy and send to a client.
 */
export default defineConfig({
  share: {
    // Which projects to include. Leave out to include every project.
    // projects: ['orbit'],
    // Where the site's root URL goes. Defaults to the first project.
    // start: '/orbit/welcome',
  },
})
