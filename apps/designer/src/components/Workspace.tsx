'use client'

import { useWorkspaceContext } from '@/context/workspace'

export default function WorkspaceSelector() {
  const { workspace, products } = useWorkspaceContext()

  if (workspace == null) {
    throw new Error('Unexpected: workspace is null')
  }

  return (
    <main>
      <div>
        <div>Workspace: ${workspace.path}</div>
        <div>Products:</div>
        <ul>
          {products.map((product) => (
            <li key={product.name}>
              <div>
                <div>
                  {/*
                  <button type="button" onClick={() => selectProduct(product.name)}>
                */}
                  {product.name}
                  {/*
                  </button>
                */}
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
