'use client'

import WorkspaceSelector from '@/components/WorkspaceSelector'
import Workspace from '@/components/Workspace'
import { useWorkspacesContext } from '@/context/workspaces'

export default function RootPage() {
  const { activeWorkspace } = useWorkspacesContext()

  if (activeWorkspace == null) {
    return <WorkspaceSelector />
  }

  return <Workspace />
}
