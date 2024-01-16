import constate from 'constate'

export interface Product {
  name: string
}

export interface ProductOptions {
  productName: string
}

export interface ProductState {
  product: Product
}

function useProduct(options: ProductOptions): ProductState {
  const { productName } = options

  const product = { name: productName }

  return {
    product,
  }
}

export const [ProductProvider, useProductContext] = constate(useProduct)
