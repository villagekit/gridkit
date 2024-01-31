import { invoke } from '@tauri-apps/api'
import constate from 'constate'
import { useEffect, useState } from 'react'

export interface ProductOptions {
  productPath: string
}

export interface ProductMeta {
  name: string
}

export interface Product {
  meta: ProductMeta
}

export interface ProductState {
  product: Product | null
}

function useProduct(options: ProductOptions): ProductState {
  const { productPath } = options

  const [productMeta, setProductMeta] = useState<ProductMeta | null>(null)

  useEffect(() => {
    ;(async () => {
      const productMeta = await invoke('get_product_meta', { productPath })
      console.log('product meta', productMeta)
      setProductMeta(productMeta as ProductMeta)
    })()
  }, [productPath])

  if (productMeta == null) return { product: null }

  return {
    product: {
      meta: productMeta,
    },
  }
}

export const [ProductProvider, useProductContext] = constate(useProduct)
