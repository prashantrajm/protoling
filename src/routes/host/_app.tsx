import { createFileRoute, Outlet } from '@tanstack/react-router'
import { useEffect } from 'react'
import { CommandPalette } from '@/components/shell/CommandPalette'
import { GlobalHotkeys } from '@/components/shell/GlobalHotkeys'
import { PhoneDialog } from '@/components/shell/PhoneDialog'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useWorkspace } from '@/lib/workspace/store'

/** Desktop surfaces: project pages, canvas and focus preview. */
export const Route = createFileRoute('/_app')({ component: AppLayout })

function AppLayout() {
  const refreshMeta = useWorkspace((s) => s.refreshMeta)

  useEffect(() => {
    void refreshMeta()
    const onFocus = () => void refreshMeta()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [refreshMeta])

  return (
    <TooltipProvider delayDuration={400}>
      <Outlet />
      <GlobalHotkeys />
      <CommandPalette />
      <PhoneDialog />
      <Toaster position="bottom-center" />
    </TooltipProvider>
  )
}
