'use client'

import { ProductProvider } from '@/context/product'
import { WorkspaceProvider, useWorkspaceContext } from '@/context/workspace'
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

  if (activeWorkspace == null) return children

  return <WorkspaceProvider workspace={activeWorkspace}>{children}</WorkspaceProvider>
}

export function ProductLayout({ children }: LayoutProps) {
  const { activeProductName } = useWorkspaceContext()

  if (activeProductName == null) return children

  return <ProductProvider productName={activeProductName}>{children}</ProductProvider>
}
