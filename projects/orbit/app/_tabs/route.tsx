import { createFileRoute, Outlet } from '@tanstack/react-router'
import { useTabs } from '@/runtime'
import { TabBar } from '../../shared/ui'

/** Pathless layout: everything inside shows the tab bar. */
export const Route = createFileRoute('/orbit/_tabs')({ component: Tabs })

function Tabs() {
  const tabs = useTabs({
    today: '/orbit/today',
    search: '/orbit/search',
    inbox: '/orbit/inbox',
    me: '/orbit/me',
  })
  return (
    <div className="flex h-full flex-col bg-white">
      <div className="relative min-h-0 flex-1">
        <Outlet />
      </div>
      <TabBar active={tabs.active} onSelect={tabs.select} />
    </div>
  )
}
