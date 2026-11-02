import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/spike/')({
  beforeLoad: () => {
    throw redirect({ to: '/spike/today' })
  },
})
