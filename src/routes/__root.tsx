import { createRootRoute, Outlet } from '@tanstack/react-router'

export const Route = createRootRoute({
  component: Outlet,
  notFoundComponent: () => (
    <div className="grid h-full place-items-center text-sm text-muted-foreground">
      Nothing here.
    </div>
  ),
})
