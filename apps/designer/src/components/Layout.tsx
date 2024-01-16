'use client'

import { WorkspaceProvider } from '@/context/workspace'
import { WorkspacesProvider, useWorkspacesContext } from '@/context/workspaces'

export interface LayoutProps {
  children: React.ReactNode
}
export function AppLayout({ children }: LayoutProps) {
  return (
    <WorkspacesLayout>
      <WorkspaceLayout>{children}</WorkspaceLayout>
    </WorkspacesLayout>
  )
}

export function WorkspacesLayout({ children }: LayoutProps) {
  return <WorkspacesProvider>{children}</WorkspacesProvider>
}

export function WorkspaceLayout({ children }: LayoutProps) {
  const { activeWorkspace } = useWorkspacesContext()

  return <WorkspaceProvider workspace={activeWorkspace}>{children}</WorkspaceProvider>
}
