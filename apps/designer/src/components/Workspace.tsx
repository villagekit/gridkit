'use client'

import { useWorkspaceContext } from '@/context/workspace'
import { useWorkspacesContext } from '@/context/workspaces'

export default function WorkspaceSelector() {
  const { activeWorkspace } = useWorkspacesContext()
  const { products, selectProduct } = useWorkspaceContext()

  if (activeWorkspace == null) {
    throw new Error('Unexpected: activeWorkspace is null')
  }

  return (
    <main>
      <div>
        <div>Workspace: ${activeWorkspace.path}</div>
        <div>Products:</div>
        <ul>
          {products.map((product) => (
            <li key={product.name}>
              <div>
                <div>
                  <button type="button" onClick={() => selectProduct(product.name)}>
                    {product.name}
                  </button>
                </div>
                {/*
                <button type="button" onClick={() => removeProduct(product.name)}>
                  X
                </button>
                */}
              </div>
            </li>
          ))}
        </ul>
        {/*
        <button type="button" onClick={handleCreateProduct}>
          Create new product
        </button>
        */}
      </div>
    </main>
  )
}
