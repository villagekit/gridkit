'use client'

import WorkspaceSelector from '@/components/WorkspaceSelector'
import Workspace from '@/components/Workspace'
import Product from '@/components/Product'
import { useWorkspacesContext } from '@/context/workspaces'
import { useWorkspaceContext } from '@/context/workspace'

export default function RootPage() {
  const { activeWorkspace } = useWorkspacesContext()

  if (activeWorkspace == null) {
    return <WorkspaceSelector />
  }

  return <WorkspacePage />
}

function WorkspacePage() {
  const { activeProductIndex } = useWorkspaceContext()

  if (activeProductIndex == null) {
    return <Workspace />
  }

  return <Product />
}
