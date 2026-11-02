import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/spike/me')({ component: Me })

function Me() {
  return (
    <div className="h-full bg-white p-5">
      <h1 className="text-3xl font-bold" data-me>
        Me
      </h1>
    </div>
  )
}
