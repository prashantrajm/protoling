import type { ReactNode } from 'react'
import { AppSidebar } from './AppSidebar'

export function ProjectsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto px-10 py-7">{children}</main>
    </div>
  )
}
