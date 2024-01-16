import constate from 'constate'
import { useEffect, useMemo, useState } from 'react'
import { invoke } from '@tauri-apps/api'

import { Workspace } from './workspaces'

export interface WorkspaceOptions {
  workspace: Workspace
}

export interface ProductIndex {
  path: string
  name: string
}

export interface WorkspaceState {
  productIndexes: Array<ProductIndex>
  activeProductIndex: ProductIndex | null
  selectProductName: (productName: string | null) => void
  // createProduct: (productName: string) => void
  // removeProduct: (productName: string) => void
}

function useWorkspace(options: WorkspaceOptions): WorkspaceState {
  const { workspace } = options

  const [productIndexes, setProductIndexes] = useState<Array<ProductIndex>>([])
  const [activeProductName, selectProductName] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      const { path: workspacePath } = workspace
      const products = await invoke('list_products', { workspacePath })
      setProductIndexes(products as Array<ProductIndex>)
    })()
  }, [workspace])

  const activeProductIndex = useMemo(() => {
    if (activeProductName == null) return null
    return productIndexes.find((productIndex) => productIndex.name === activeProductName) || null
  }, [productIndexes, activeProductName])

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
    productIndexes,
    activeProductIndex,
    selectProductName,
  }
}

export const [WorkspaceProvider, useWorkspaceContext] = constate(useWorkspace)
