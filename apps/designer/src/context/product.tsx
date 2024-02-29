import { client } from '@/client'
import { DesignFile } from '@villagekit/sandbox'
import constate from 'constate'

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

export const [ProductProvider, useProductContext] = constate(useProduct)
