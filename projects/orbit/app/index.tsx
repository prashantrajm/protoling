import { createFileRoute, redirect } from '@tanstack/react-router'

// The app opens on onboarding, which hands over to the tabs.
export const Route = createFileRoute('/orbit/')({
  beforeLoad: () => {
    throw redirect({ to: '/orbit/welcome', replace: true })
  },
})
