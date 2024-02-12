import constate from 'constate'
import { useEffect, useMemo, useState } from 'react'
import { invoke } from '@tauri-apps/api'

import { Workspace } from './workspaces'

export interface WorkspaceOptions {
  workspace: Workspace
}

export interface ProductIndex {
  path: string
  id: string
}

export interface WorkspaceState {
  productIndexes: Array<ProductIndex>
  activeProductIndex: ProductIndex | null
  selectProductId: (productId: string | null) => void
  // createProduct: (productId: string) => void
  // removeProduct: (productId: string) => void
}

function useWorkspace(options: WorkspaceOptions): WorkspaceState {
  const { workspace } = options

  const [productIndexes, setProductIndexes] = useState<Array<ProductIndex>>([])
  const [activeProductId, selectProductId] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      const { path: workspacePath } = workspace
      const products = await invoke('list_products', { workspacePath })
      setProductIndexes(products as Array<ProductIndex>)
    })()
  }, [workspace])

  const activeProductIndex = useMemo(() => {
    if (activeProductId == null) return null
    return productIndexes.find((productIndex) => productIndex.id === activeProductId) || null
  }, [productIndexes, activeProductId])

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
    selectProductId,
  }
}

export const [WorkspaceProvider, useWorkspaceContext] = constate(useWorkspace)
