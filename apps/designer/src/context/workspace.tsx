'use client'

import constate from 'constate'
import { useCallback, useEffect, useState } from 'react'
import { invoke } from '@tauri-apps/api'

import { Workspace, useWorkspacesContext } from './workspaces'

export interface Product {
  name: string
}

export interface WorkspaceState {
  workspace: Workspace | null
  selectWorkspace: (workspacePath: string | null) => void
  products: Array<Product>
  // createProduct: (productName: string) => void
  // removeProduct: (productName: string) => void
}

function useWorkspace(): WorkspaceState {
  const [workspacePath, selectWorkspace] = useState<string | null>(null)

  const { workspaces } = useWorkspacesContext()
  const workspace = workspaces?.find((workspace) => workspace.path === workspacePath) || null

  console.log('workspace', workspace)

  const [products, setProducts] = useState<Array<Product>>([])

  useEffect(() => {
    ;(async () => {
      const products = await invoke('list_products', { workspacePath })
      setProducts(products as Array<Product>)
    })()
  }, [workspacePath])

  /*
  const addWorkspace = useCallback(
    (workspacePath: string) => {
      if (workspaces.find((workspace) => workspace.path === workspacePath)) {
        return
      }

      const newWorkspace = { path: workspacePath }
      const nextWorkspaces = [...workspaces, newWorkspace]
      setWorkspaces(nextWorkspaces)

      invoke('add_workspace', { workspace: newWorkspace })
    },
    [workspaces],
  )

  const removeWorkspace = useCallback(
    (workspacePath: string) => {
      const nextWorkspaces = workspaces.filter((workspace) => workspace.path !== workspacePath)
      setWorkspaces(nextWorkspaces)

      invoke('remove_workspace', { workspacePath })
    },
    [workspaces],
  )
  */

  return {
    workspace,
    selectWorkspace,
    products,
  }
}

export const [WorkspaceProvider, useWorkspaceContext] = constate(useWorkspace)
