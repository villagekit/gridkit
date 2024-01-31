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
      <WorkspaceLayout>
        <ProductLayout>{children}</ProductLayout>
      </WorkspaceLayout>
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
  const { activeProductIndex } = useWorkspaceContext()

  if (activeProductIndex == null) return children

  return <ProductProvider productPath={activeProductIndex.path}>{children}</ProductProvider>
}
