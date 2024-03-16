import type { PropsWithChildren, ReactNode } from 'react'
import type { z } from 'zod'
import type { metaSchema } from './schema'

export type ProductMeta = z.infer<typeof metaSchema>

export type ProductData = {
  meta: ProductMeta
  code: string
}

export type ProductProviderProps = PropsWithChildren<{}>
export type ProductProvider = (props: ProductProviderProps) => ReactNode
export type ProductGlProps = {}
export type ProductGl = (props: ProductGlProps) => ReactNode
export type ProductSummaryProps = {}
export type ProductSummary = (props: ProductSummaryProps) => ReactNode
export type ProductInfoProps = {}
export type ProductInfo = (props: ProductInfoProps) => ReactNode

export type ProductModule = {
  id: string
  components: {
    ProductProvider: ProductProvider
    ProductGl: ProductGl
    ProductSummary: ProductSummary
    ProductInfo: ProductInfo
  }
}
