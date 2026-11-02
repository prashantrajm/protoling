/**
 * Renders app states to PNGs, so you (or a coding agent) can see a screen
 * without opening a browser.
 *
 *   bun run snap orbit/today
 *   bun run snap "orbit/today/detail?task=sprint" orbit/me --device iphone-se
 *   bun run snap orbit/today --frames 6     # a strip of frames, every 100ms
 *
 * Starts Protoling's dev server, opens each URL in the play view and
 * captures the phone, status bar included. Uses your installed Google Chrome
 * through playwright-core; no browser download.
 */
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright-core'
import { createServer } from 'vite'

const args = process.argv.slice(2)
const flag = (name: string) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? args.splice(i, 2)[1] : undefined
}
const device = flag('device')
const frames = Number(flag('frames') ?? 1)
const outDir = flag('out') ?? 'snaps'
const urls = args.filter((a) => !a.startsWith('--'))

if (urls.length === 0) {
  console.error(
    'Usage: bun run snap <project/path[?query]> [...] [--device id] [--frames n] [--out dir]',
  )
  process.exit(1)
}

const server = await createServer({ server: { port: 0 }, logLevel: 'error' })
await server.listen()
const base = server.resolvedUrls?.local[0]?.replace(/\/$/, '')
if (!base) throw new Error('Dev server did not start')

const browser = await chromium
  .launch({ channel: 'chrome', headless: true })
  .catch((error) => {
    console.error(
      'Could not launch Google Chrome. Install it, or check playwright-core supports your version.',
    )
    throw error
  })

try {
  const page = await browser.newPage({
    viewport: { width: 1600, height: 1300 },
    deviceScaleFactor: 2,
  })
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await mkdir(outDir, { recursive: true })

  for (const url of urls) {
    const [inside, query = ''] = url.replace(/^\//, '').split('?')
    const [project, ...rest] = inside.split('/')
    const play = `${base}/p/${project}/play/${rest.join('/')}${query ? `?${query}` : ''}`
    const phone = page.locator('iframe')
    // The device is page state, so it's chosen again after every load.
    const open = async () => {
      await page.goto(play, { waitUntil: 'networkidle' })
      await phone.waitFor()
      if (device) {
        await page.getByRole('combobox', { name: 'Device' }).click()
        await page
          .getByRole('option')
          .filter({ hasText: new RegExp(`^${device.replace(/-/g, ' ')}$`, 'i') })
          .first()
          .click()
      }
    }
    await open()
    const name =
      inside.replace(/\//g, '_') + (query ? `_${query.replace(/[^a-z0-9]+/gi, '-')}` : '')

    if (frames > 1) {
      // Replay (R) so the strip starts at the entrance animation.
      await page.locator('body').click({ position: { x: 5, y: 600 } })
      await page.keyboard.press('r')
      for (let i = 0; i < frames; i++) {
        const file = path.join(outDir, `${name}.${String(i).padStart(2, '0')}.png`)
        await phone.screenshot({ path: file })
        console.log(file)
        await page.waitForTimeout(100)
      }
    } else {
      await page.waitForTimeout(1200) // let entrance animations settle
      const file = path.join(outDir, `${name}.png`)
      await phone.screenshot({ path: file })
      console.log(file)
    }
  }
  if (errors.length) {
    console.error(`\nErrors in the page:\n${errors.join('\n')}`)
    process.exitCode = 1
  }
} finally {
  await browser.close()
  await server.close()
}
