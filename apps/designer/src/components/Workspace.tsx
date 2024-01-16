'use client'

import { useWorkspaceContext } from '@/context/workspace'
import { useWorkspacesContext } from '@/context/workspaces'

export default function WorkspaceSelector() {
  const { activeWorkspace } = useWorkspacesContext()
  const { productIndexes, selectProductName } = useWorkspaceContext()

  if (activeWorkspace == null) {
    throw new Error('Unexpected: activeWorkspace is null')
  }

  return (
    <main>
      <div>
        <div>Workspace: ${activeWorkspace.path}</div>
        <div>Products:</div>
        <ul>
          {productIndexes.map((productIndex) => (
            <li key={productIndex.path}>
              <div>
                <div>
                  <button type="button" onClick={() => selectProductName(productIndex.name)}>
                    {productIndex.name}
                  </button>
                </div>
                {/*
                <button type="button" onClick={() => removeproductName(productName.name)}>
                  X
                </button>
                */}
              </div>
            </li>
          ))}
        </ul>
        {/*
        <button type="button" onClick={handleCreateproductName}>
          Create new productName
        </button>
        */}
      </div>
    </main>
  )
}
