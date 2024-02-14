'use client'

import { DesignWrapper } from '@villagekit/design'
import React from 'react'

import { useProductContext } from '@/context/product'
import { Sandbox } from '@villagekit/sandbox'

export default function Product() {
  const { product } = useProductContext()

  if (product == null) {
    return <main>Loading</main>
  }

  return (
    <DesignWrapper design={product}>
      <main>
        <div>
          <div>Product: {product.meta.label}</div>
          <div>Product: {JSON.stringify(product, null, 2)}</div>
          <div>
            <React.Suspense>
              <Sandbox />
            </React.Suspense>
          </div>
        </div>
      </main>
    </DesignWrapper>
  )
}
