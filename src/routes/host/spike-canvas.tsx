import {
  createFileRoute,
  createMemoryHistory,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router'
import { useState } from 'react'
import { routeTree } from '@/routeTree.gen'

/** SPIKE: three independent routers on one page, each at its own URL. */
export const Route = createFileRoute('/spike-canvas')({ component: Canvas })

const urls = ['/spike/today', '/spike/today/detail?task=b', '/spike/me']

function Canvas() {
  return (
    <div className="flex gap-8 p-8">
      {urls.map((url) => (
        <MiniApp key={url} url={url} />
      ))}
    </div>
  )
}

function MiniApp({ url }: { url: string }) {
  const [router] = useState(() =>
    createRouter({ routeTree, history: createMemoryHistory({ initialEntries: [url] }) }),
  )
  return (
    <div
      data-frame={url}
      className="relative overflow-hidden rounded-[40px] border [transform:translateZ(0)]"
      style={{ width: 393, height: 852, containerType: 'size' }}
    >
      <RouterProvider router={router} />
    </div>
  )
}
