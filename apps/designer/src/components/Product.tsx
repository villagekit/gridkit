'use client'

import { useProductContext } from '@/context/product'
import { ParameterControlsContextProvider } from '@villagekit/parameters'

export default function Product() {
  const { product } = useProductContext()

  if (product == null) {
    return <main>Loading</main>
  }

  console.log('product.meta', product.meta)

  return (
    <ParameterControlsContextProvider
      parameters={product.meta.parameters}
      presets={product.meta.presets}
    >
      <main>
        <div>
          <div>Product: {product.meta.name}</div>
          <div>Product: {JSON.stringify(product, null, 2)}</div>
        </div>
      </main>
    </ParameterControlsContextProvider>
  )
}
