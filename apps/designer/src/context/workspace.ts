import constate from 'constate'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { invoke } from '@tauri-apps/api'

import { Workspace } from './workspaces'

export interface Product {
  name: string
}

export interface WorkspaceOptions {
  workspace: Workspace | null
}

export interface WorkspaceState {
  products: Array<Product>
  activeProduct: Product | null
  selectProduct: (productName: string | null) => void
  // createProduct: (productName: string) => void
  // removeProduct: (productName: string) => void
}

function useWorkspace(options: WorkspaceOptions): WorkspaceState {
  const { workspace } = options

  const [products, setProducts] = useState<Array<Product>>([])
  const [activeProductName, selectProduct] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      if (workspace == null) return
      const { path: workspacePath } = workspace
      const products = await invoke('list_products', { workspacePath })
      setProducts(products as Array<Product>)
    })()
  }, [workspace])

  const activeProduct = useMemo(() => {
    if (activeProductName == null) return null
    return products.find((product) => product.name === activeProductName) || null
  }, [activeProductName, products])

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
    products,
    activeProduct,
    selectProduct,
  }
}

export const [WorkspaceProvider, useWorkspaceContext] = constate(useWorkspace)
