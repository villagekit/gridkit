import { client } from '@/client'
import { SandboxProvider, DesignFile } from '@villagekit/sandbox'
import constate from 'constate'
import { createContext, useContext } from 'react'

type ProviderProps = {
  children: React.ReactNode
}

export interface ProductOptions {
  productPath: string
}

type ProductState = null | {
  file: DesignFile
}

function useProduct(options: ProductOptions): ProductState {
  const { productPath } = options

  const productMetaQuery = client.getProductMeta.useQuery({ productPath })

  const productEntryQuery = client.getProductEntry.useQuery(
    { productEntryPath: productMetaQuery.isSuccess ? productMetaQuery.data.entry : '' },
    { enabled: productMetaQuery.isSuccess },
  )

  if (!productMetaQuery.isSuccess || !productEntryQuery.isSuccess) return null

  const { type, entry } = productMetaQuery.data
  const code = productEntryQuery.data
  const language = entry.endsWith('.ts')
    ? 'typescript'
    : entry.endsWith('.js')
    ? 'javascript'
    : 'unknown'
  if (language === 'unknown') throw new Error(`Unexpected product entry extension: ${entry}`)
  return {
    file: {
      type,
      code,
      language,
    },
  }
}

export const ProductContext = createContext<ProductState | null>(null)

export function useProductContext() {
  return useContext(ProductContext)
}

export function ProductProvider(props: ProductOptions & ProviderProps) {
  const { children, ...options } = props

  const product = useProduct(options)

  const sandbox =
    product == null ? children : <SandboxProvider file={product.file}>{children}</SandboxProvider>

  return <ProductContext.Provider value={product}>{sandbox}</ProductContext.Provider>
}
