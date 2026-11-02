import { createFileRoute, Outlet } from '@tanstack/react-router'

/** Orbit's root. Everything in app/ is a plain TanStack route, mounted at /orbit. */
export const Route = createFileRoute('/orbit')({ component: Outlet })
