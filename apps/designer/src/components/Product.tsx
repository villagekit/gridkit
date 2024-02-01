'use client'

import { useProductContext } from '@/context/product'

export default function Product() {
  const { product } = useProductContext()

  if (product == null) {
    return <main>Loading</main>
  }

  return (
    <main>
      <div>
        <div>Product: {product.meta.name}</div>
        <div>Product: {JSON.stringify(product, null, 2)}</div>
      </div>
    </main>
  )
}
