import config from 'virtual:protoling/config'
import {
  createRootRoute,
  Outlet,
  redirect,
  retainSearchParams,
  useLocation,
} from '@tanstack/react-router'
import { MiniAppHost } from '@/components/app/MiniAppHost'
import { useAppProjects } from '@/lib/workspace/store'

export const Route = createRootRoute({
  // `v` holds variant choices for the screens of a mini app, so links can be
  // shared. Kept across navigation.
  validateSearch: (search: Record<string, unknown>): { v?: string } => ({
    v: typeof search.v === 'string' && search.v ? search.v : undefined,
  }),
  search: { middlewares: [retainSearchParams(['v'])] },
  // A share build has nothing but the prototypes: the root and any URL
  // outside them go to the start screen.
  beforeLoad: ({ location }) => {
    if (config.mode !== 'share') return
    if (!config.projects.includes(location.pathname.split('/')[1])) {
      throw redirect({ href: config.start, replace: true })
    }
  },
  component: Root,
  notFoundComponent: () => (
    <div className="grid h-full place-items-center text-sm text-muted-foreground">
      Nothing here.
    </div>
  ),
})

function Root() {
  const { pathname } = useLocation()
  const projects = useAppProjects()
  const first = pathname.split('/')[1]
  if (projects.includes(first)) {
    return (
      <MiniAppHost project={first}>
        <Outlet />
      </MiniAppHost>
    )
  }
  return <Outlet />
}
