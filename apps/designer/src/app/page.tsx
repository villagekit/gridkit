'use client'

import { useWorkspaceContext } from '@/context/workspace'
import WorkspaceSelector from '@/components/WorkspaceSelector'
import Workspace from '@/components/Workspace'

export default function RootPage() {
  const { workspace } = useWorkspaceContext()

  if (workspace == null) {
    return <WorkspaceSelector />
  }

  return <Workspace />
}
