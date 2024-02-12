import './index.css'

import * as React from 'react'
import { createRoot } from 'react-dom/client'

import { AppLayout } from '@/components/Layout'
import WorkspaceSelector from '@/components/WorkspaceSelector'
import Workspace from '@/components/Workspace'
import Product from '@/components/Product'
import { useWorkspacesContext } from '@/context/workspaces'
import { useWorkspaceContext } from '@/context/workspace'

const rootElement = document.getElementById('root')

if (rootElement == null) throw new Error('Failed to get root HTML element')

createRoot(rootElement).render(
  <React.StrictMode>
    <AppLayout>
      <RootPage />
    </AppLayout>
  </React.StrictMode>,
)

function RootPage() {
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
